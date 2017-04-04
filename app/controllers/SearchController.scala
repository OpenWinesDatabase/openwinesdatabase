package controllers

import actions.WineAction
import env.Env
import gopf.play.GoodOldPlayframework
import play.api.libs.json._
import play.api.libs.ws.WSAuthScheme
import play.api.mvc._

import scala.concurrent.Future

object SearchController extends Controller with GoodOldPlayframework {

  implicit val ec = defaultContext
  implicit val mat = defaultMaterializer

  def search = WineAction.async { ctx =>
    ctx.request.getQueryString("q") match {
      case None => Future.successful(BadRequest("Missing 'q' query parameter"))
      case Some(q) => {
        val query =
          s"""{
             |  "query": {
             |    "multi_match": {
             |      "fields": [ "year", "region", "name^2" ],
             |      "query": ${Json.stringify(JsString(q))}
             |    }
             |  },
             |  "size": 20
             |}""".stripMargin

        WS.url(Env.esServiceURL + "/wines/_search")
          .withAuth(Env.esServiceLogin, Env.esServicePassword, WSAuthScheme.BASIC)
          .post(query)
          .map(response => {
            Ok(Json.obj("wines" -> (response.json \ "hits" \ "hits").as[JsArray].value.map(hit => {
              val source = (hit \ "_source").as[JsValue]
              Json.obj(
                "id" -> (hit \ "_id").as[String],
                "timestamp" -> (source \ "@timestamp").as[String],
                "name" -> (source \ "name").as[String],
                "year" -> (source \ "year").asOpt[String],
                "color" -> (source \ "color").asOpt[String],
                "region" -> (source \ "region").as[String],
                "country" -> (source \ "country").as[String],
                "externalPhotoUrl" -> (source \ "externalPhotoUrl").asOpt[String]
              )
            })))
          })
      }
    }
  }

  def countries = WineAction.async { ctx =>
    val query =
      s"""{
         |  "size": 0,
         |  "aggs" : {
         |    "countries" : {
         |      "terms" : {
         |        "field" : "country.keyword",
         |        "size" : 30,
         |        "order" : { "_count" : "desc" }
         |      }
         |    }
         |  }
         |}""".stripMargin

    WS.url(Env.esServiceURL + "/wines/_search")
      .withAuth(Env.esServiceLogin, Env.esServicePassword, WSAuthScheme.BASIC)
      .post(query)
      .map(response => {
        val buckets: JsArray = (response.json \ "aggregations" \ "countries" \ "buckets").as[JsArray]
        val countries: Seq[JsValue] = buckets.value.map(bucket => Json.obj(
          "name" -> (bucket \ "key").as[String],
          "totalWines" -> (bucket \ "doc_count").as[Int]
        ))
        Ok(Json.obj("countries" -> countries))
      })
  }

  def regions = WineAction.async { ctx =>
    val country = ctx.request.getQueryString("country").getOrElse("")
    val query =
      s"""{
         |  "query": {
         |    "match" : {
         |        "country" : ${Json.stringify(JsString(country))}
         |    }
         |  },
         |  "size": 0,
         |  "aggs" : {
         |      "regions" : {
         |          "terms" : {
         |            "field" : "region.keyword",
         |            "size" : 200,
         |            "order" : { "_count" : "desc" }
         |          }
         |      }
         |  }
         |}""".stripMargin

    WS.url(Env.esServiceURL + "/wines/_search")
      .withAuth(Env.esServiceLogin, Env.esServicePassword, WSAuthScheme.BASIC)
      .post(query)
      .map(response => {
        val buckets: JsArray = (response.json \ "aggregations" \ "regions" \ "buckets").as[JsArray]
        val countries: Seq[JsValue] = buckets.value.map(bucket => Json.obj(
          "name" -> (bucket \ "key").as[String],
          "totalWines" -> (bucket \ "doc_count").as[Int]
        ))
        Ok(Json.obj("regions" -> countries))
      })
  }

  def wines = WineAction.async { ctx =>
    val country = ctx.request.getQueryString("country").getOrElse("")
    val region = ctx.request.getQueryString("region").getOrElse("")
    val query =
      s"""{
         |  "query": {
         |    "bool": {
         |      "must": [
         |        { "match": { "country.keyword": ${Json.stringify(JsString(country))} }},
         |        { "match": { "region.keyword": ${Json.stringify(JsString(region))} }}
         |      ]
         |    }
         |  },
         |  "size": 200
         |}""".stripMargin

    WS.url(Env.esServiceURL + "/wines/_search")
      .withAuth(Env.esServiceLogin, Env.esServicePassword, WSAuthScheme.BASIC)
      .post(query)
      .map(response => {
        val hits: JsArray = (response.json \ "hits" \ "hits").as[JsArray]
        val wines: Seq[JsValue] = hits.value.map(hit => {
          val source = (hit \ "_source").as[JsObject]

          source ++ Json.obj("timestamp" -> (source \ "@timestamp").as[String]) - "@timestamp" ++ Json.obj("id" -> (hit \ "_id").as[String])

          Json.obj(
            "id" -> (hit \ "_id").as[String],
            "timestamp" -> (source \ "@timestamp").as[String],
            "name" -> (source \ "name").as[String],
            "year" -> (source \ "year").asOpt[String],
            "color" -> (source \ "color").asOpt[String],
            "region" -> (source \ "region").as[String],
            "country" -> (source \ "country").as[String],
            "externalPhotoUrl" -> (source \ "externalPhotoUrl").asOpt[String]
          )
        })
        Ok(Json.obj("wines" -> wines))
      })
  }

  def wine(id: String) = WineAction.async { ctx =>
    WS.url(Env.esServiceURL + s"/wines/wine/$id")
      .withAuth(Env.esServiceLogin, Env.esServicePassword, WSAuthScheme.BASIC)
      .get()
      .map(response => {
        val found: Boolean = (response.json \ "found").as[Boolean]
        if (!found) {
          NotFound("Wine not found")
        } else {
          Ok((response.json \ "_source").as[JsValue])
        }
      })
  }
}
