package utils

import controllers.HomeController.WS
import env.Env
import org.joda.time.DateTime
import play.api.libs.json.{JsValue, Json}
import play.api.libs.ws.WSAuthScheme

object ESUtils {
  def logSearch(query: String, maxScore: Double, nbHits: Int): Unit = {

    val now = DateTime.now;
    val log = Json.obj(
      "@timestamp" -> formatTimeStamp(now),
      "query" -> query,
      "maxScore" -> maxScore,
      "nbHits" -> nbHits
    )

    WS.url(indexURL(now))
      .withAuth(Env.esServiceLogin, Env.esServicePassword, WSAuthScheme.BASIC)
      .post(log)
  }

  trait EditAction {
    def name: String
  }

  case object WineCreated extends EditAction {
    override def name: String = "Created"
  }
  case object WineUpdated extends EditAction {
    override def name: String = "Updated"
  }
  case object WineDeleted extends EditAction {
    override def name: String = "Deleted"
  }


  def logEdit(id: String, optionWine: Option[JsValue], editAction: EditAction): Unit = {
    val now = DateTime.now;
    val log = optionWine.map {
      wine =>
        Json.obj(
          "name" -> (wine \ "name").as[String],
          "year" -> (wine \ "year").as[String],
          "region" -> (wine \ "region").as[String],
          "country" -> (wine \ "country").as[String]
        )
    }.getOrElse(Json.obj()) +
      ("@timestamp" -> Json.toJson(formatTimeStamp(now))) +
      ("editAction" -> Json.toJson(editAction.name)) +
      ("id" -> Json.toJson(id))

    WS.url(indexURL(now))
      .withAuth(Env.esServiceLogin, Env.esServicePassword, WSAuthScheme.BASIC)
      .post(log)
  }

  private def indexURL(now: DateTime) = {
    Env.esServiceURL + "/query-logs-" + now.toString("yyyy-MM") + "/log"
  }

  def formatTimeStamp(now: DateTime) = {
    now.toString("yyyy-MM-dd'T'HH:mm:ss.SSSZ")
  }
}
