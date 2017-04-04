package controllers

import java.util.{Base64, UUID}

import actions.{WineAction, WineActionCtx}
import env.Env
import fly.play.s3.{BucketFile, S3}
import gopf.play.GoodOldPlayframework
import org.joda.time.DateTime
import play.api.libs.json._
import play.api.libs.ws.WSAuthScheme
import play.api.mvc._
import utils.ESUtils
import utils.ESUtils.{EditAction, WineCreated, WineDeleted, WineUpdated}

import scala.concurrent.Future

object EditController extends Controller with GoodOldPlayframework {

  implicit val ec = defaultContext
  implicit val mat = defaultMaterializer

  private val s3 = S3.fromApplication(Play.current)
  private val bucketName = "owd-wip-photos"
  private val wipPhotosBucket = s3.getBucket(bucketName)
  private val fileNamePattern = "^(.*)(\\.[a-z]+)$".r

  def updateWine(id: String) = WineAction.async(parse.json) { ctx =>
    if (ctx.user.isEmpty) {
      Future.successful(Unauthorized("You need to be authenticated to update a wine"))
    }

    def image = (ctx.request.body \ "photoData").asOpt[String].getOrElse("")

    def base64EncodedImage = image.replace("data:image/png;base64,", "")


    if (hasBodyGotEmptyFields(ctx)) {
      Future.successful(BadRequest("All field should be valid"))
    } else {
      if (!base64EncodedImage.isEmpty) {
        val decode = Base64.getDecoder.decode(base64EncodedImage)
        checkNotPornAndInsertToS3(decode, id)
          .flatMap { fileName =>
            val photoURL = Option.apply(s"http://${bucketName}.s3.amazonaws.com/${fileName}")
            insertDataInElasticSearch(id, ctx, photoURL, WineUpdated)
          }
          .map { _ =>
            Ok("Wine Updated")
          }
      } else {
        val photoURL = (ctx.request.body \ "externalPhotoUrl").asOpt[String].getOrElse("")
        if (!photoURL.startsWith(s"http://${bucketName}.s3.amazonaws.com/") && !photoURL.startsWith("http://images.vivino.com/thumbs/")) {
          Future.successful(BadRequest("externalPhotoUrl should not be changed this way ..."))
        } else {

          insertDataInElasticSearch(id, ctx, Option.empty, WineUpdated)
            .map { _ =>
              Ok("Wine Updated")
            }
        }
      }
    }
  }

  private def insertDataInElasticSearch(id: String, ctx: WineActionCtx[JsValue], fileName: Option[String], action: EditAction) = {
    println(ctx.request.body)
    val externalPhotoURL = fileName.getOrElse((ctx.request.body.as[JsObject] \ "externalPhotoUrl").as[String])
    println(externalPhotoURL)

    val wine = ((ctx.request.body.as[JsObject] - "photoData") +
      ("externalPhotoUrl" -> Json.toJson(externalPhotoURL))) +
      ("origin" -> Json.toJson("OpenWineDataBase")) +
      ("@timestamp" -> Json.toJson(ESUtils.formatTimeStamp(DateTime.now)))

    ESUtils.logEdit(id, Option.apply(wine), action)

    WS.url(Env.esServiceURL + s"/wines/wine/${id}")
      .withAuth(Env.esServiceLogin, Env.esServicePassword, WSAuthScheme.BASIC)
      .post(wine)
  }

  def deleteWine(id: String) = WineAction.async { ctx =>
    if (ctx.user.isEmpty) {
      Future.successful(Unauthorized("You need to be authenticated to update a wine"))
    }

    ESUtils.logEdit(id, Option.empty, WineDeleted)

    WS.url(Env.esServiceURL + s"/wines/wine/$id")
      .withAuth(Env.esServiceLogin, Env.esServicePassword, WSAuthScheme.BASIC)
      .delete()
      .map(response => {
        println(response)
        if (response.status == 200) {
          Ok(s"Wine ${id} successfully deleted")
        } else {
          NotFound(s"Could not find Wine ${id}")
        }
      })
  }

  def createWine() = WineAction.async(parse.json) { ctx =>
    if (ctx.user.isEmpty) {
      Future.successful(Unauthorized("You need to be authenticated to update a wine"))
    }

    def image = (ctx.request.body \ "photoData").asOpt[String].getOrElse("")

    def base64EncodedImage = image.replace("data:image/png;base64,", "")

    if (hasBodyGotEmptyFields(ctx) || base64EncodedImage.isEmpty) {
      Future.successful(BadRequest("All field should be valid"))
    } else {
      val decode = Base64.getDecoder.decode(base64EncodedImage)

      checkNotPornAndInsertToS3(decode, UUID.randomUUID.toString)
        .flatMap { fileName =>
          val fileNamePattern(uuid, _) = fileName

          insertDataInElasticSearch(uuid, ctx, Option(s"http://${bucketName}.s3.amazonaws.com/${fileName}"), WineCreated)
        }
        .map { _ =>
          Created("Wine Created")
        }
    }
  }

  private def checkNotPornAndInsertToS3(decode: Array[Byte], id: String) = {
    WS.url(Env.visionApiEndpoint + "/analyze")
      .withHeaders(
        "Content-Type" -> "application/octet-stream",
        "Ocp-Apim-Subscription-Key" -> Env.visionApiKey
      ).withQueryString(
      "visualFeatures" -> "Adult")
      .post(decode)
      .map { response =>
        val isAdultContent = (response.json \ "adult" \ "isAdultContent").as[Boolean]
        val isRacyContent = (response.json \ "adult" \ "isRacyContent").as[Boolean]

        (isAdultContent && isRacyContent)
      }
      .flatMap {
        case false => {
          val randomFileName = id + ".png"

          val s3StorageResult = wipPhotosBucket add BucketFile(randomFileName, "image/png", decode)
          s3StorageResult.map { _ => randomFileName }
        }
        case true => Future.failed(new IllegalStateException("Explicite content are forbidden"))
      }
  }

  private def hasBodyGotEmptyFields(ctx: WineActionCtx[JsValue]) = {
    (extractStringFromBody(ctx, "name").isEmpty
      || extractStringFromBody(ctx, "year").isEmpty
      || extractStringFromBody(ctx, "region").isEmpty
      || extractStringFromBody(ctx, "country").isEmpty)
  }

  private def extractStringFromBody(ctx: WineActionCtx[JsValue], feldName: String) = {
    (ctx.request.body \ "name").asOpt[String].getOrElse("")
  }
}
