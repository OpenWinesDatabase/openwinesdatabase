package controllers

import java.util.Base64

import actions.WineAction
import env.Env
import gopf.play.GoodOldPlayframework
import play.api.Logger
import play.api.libs.json._
import play.api.libs.ws.WSAuthScheme
import play.api.mvc.Controller
import utils.ESUtils

object OCRController extends Controller with GoodOldPlayframework {

  implicit val ec = defaultContext
  implicit val mat = defaultMaterializer

  def extractText = WineAction.async(parse.json) { ctx =>
    val image = (ctx.request.body \ "image").asOpt[String].getOrElse("")
    val base64EncodedImage = image.replace("data:image/png;base64,", "")

    val decode = Base64.getDecoder.decode(base64EncodedImage)
    WS.url(Env.visionApiEndpoint + "/ocr")
      .withHeaders(
        "Content-Type" -> "application/octet-stream",
        "Ocp-Apim-Subscription-Key" -> Env.visionApiKey
      ).withQueryString(
      "language" -> "fr",
      "detectOrientation" -> "true"
    ).post(decode)
      .map {
        response =>
          (response.json \ "regions")
            .as[JsArray]
            .value
            .flatMap((region) => (region \ "lines").as[JsArray]
              .value
              .map(line => (line \ "words").as[JsArray]
                .value
                .map(word => (word \ "text").as[String])
                .mkString(" ")))
      }.flatMap { extracted =>
      val query =
        s"""{
           |  "query": {
           |    "multi_match": {
           |      "fields": [ "year", "region", "name^2" ],
           |      "query": "${extracted.mkString(" ")}"
           |    }
           |  },
           |  "min_score": 25
           |}""".stripMargin
      WS.url(Env.esServiceURL + "/wines/_search")
        .withAuth(Env.esServiceLogin, Env.esServicePassword, WSAuthScheme.BASIC)
        .post(query).map(r => (r, extracted))
    }.map {
      case (response, extracted) => {
        val json = response.json

        Logger.info(Json.prettyPrint(json))

        val maxScore = (json \ "hits" \ "max_score").asOpt[Double]
        val totalHits = (json \ "hits" \ "total").as[Int]
        ESUtils.logSearch(extracted.mkString(" "), maxScore.getOrElse(0.0), totalHits)

        val bestMatch: JsValue = (json \ "hits" \ "hits").asOpt[JsArray].flatMap(_.value.headOption).flatMap(j => (j \ "_source").asOpt[JsObject]).getOrElse(JsNull)

        Ok(Json.obj(
          "bestMatch" -> bestMatch,
          "matchingWines" -> json,
          "extracted" -> extracted,
          "images" -> image
        ))
      }
    }
  }

}
