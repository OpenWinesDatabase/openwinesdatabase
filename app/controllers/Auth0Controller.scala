package controllers

import env.{Auth0Config, Env}
import gopf.play.GoodOldPlayframework
import play.api.Logger
import play.api.http.{HeaderNames, MimeTypes}
import play.api.libs.json.{JsValue, Json}
import play.api.mvc.{Action, Controller}

import scala.concurrent.Future

object Auth0Controller extends Controller with GoodOldPlayframework {

  implicit val ec = defaultContext
  implicit val mat = defaultMaterializer

  def login(redirect: Option[String]) = Action { implicit req =>
    Ok(views.html.login()).addingToSession(
      "redirect-after-login" -> redirect.getOrElse(routes.HomeController.index().absoluteURL(Env.isProd))
    )
  }

  def logout = Action { implicit req =>
    Redirect(routes.HomeController.index()).removingFromSession(
      "usr",
      "redirect-after-login"
    )
  }

  def callback(codeOpt: Option[String] = None) = Action.async { implicit req =>
    codeOpt match {
      case None => Future.successful(BadRequest(views.html.error("No parameters supplied")))
      case Some(code) => getToken(code, Env.auth0Config).flatMap { case (idToken, accessToken) =>
        getUser(accessToken, Env.auth0Config).map { user =>
          Logger.info(s"Login successful for user '${(user \ "email").as[String]}'")
          Redirect(req.session.get("redirect-after-login").getOrElse(routes.HomeController.index().absoluteURL(Env.isProd)))
            .removingFromSession("redirect-after-login")
            .addingToSession(
              "usr" -> Json.stringify(user) // YOLO !!!!
            )
        }
      }.recover {
        case ex: IllegalStateException => Unauthorized(views.html.error(ex.getMessage))
      }
    }
  }

  def getToken(code: String, config: Auth0Config): Future[(String, String)] = {
    val Auth0Config(clientSecret, clientId, callback, domain) = config
    val tokenResponse = Env.WS.url(s"https://$domain/oauth/token")
      .withHeaders(HeaderNames.ACCEPT -> MimeTypes.JSON)
      .post(
        Json.obj(
          "client_id" -> clientId,
          "client_secret" -> clientSecret,
          "redirect_uri" -> callback,
          "code" -> code,
          "grant_type"-> "authorization_code"
        )
      )
    tokenResponse.flatMap { response =>
      (for {
        idToken <- (response.json \ "id_token").asOpt[String]
        accessToken <- (response.json \ "access_token").asOpt[String]
      } yield {
        Future.successful((idToken, accessToken))
      }).getOrElse(Future.failed[(String, String)](new IllegalStateException("Tokens not sent")))
    }

  }

  def getUser(accessToken: String, config: Auth0Config): Future[JsValue] = {
    val Auth0Config(_, _, _, domain) = config
    val userResponse = Env.WS.url(s"https://$domain/userinfo")
      .withQueryString("access_token" -> accessToken)
      .get()
    userResponse.flatMap(response => Future.successful(response.json))
  }

}
