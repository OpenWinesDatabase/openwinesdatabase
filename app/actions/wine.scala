package actions

import env.Env
import play.api.libs.json.{JsValue, Json}
import play.api.mvc.{ActionBuilder, Request, Result, Results}

import scala.concurrent.Future

/*
{
  "email":--",
  "email_verified":true,
  "name":"Mathieu Ancelin",
  "given_name":"Mathieu",
  "family_name":"Ancelin",
  "picture":"--",
  "gender":"male",
  "locale":"fr",
  "clientID":"--",
  "updated_at":"2017-03-29T12:28:25.802Z",
  "user_id":"--",
  "nickname":"mathieu.ancelin",
  "identities":[--],
  "created_at":"2017-03-29T12:21:53.648Z",
  "sub":"--"
}
 */
case class WineActionCtx[A](request: Request[A], user: Option[JsValue]) {
  def isAuth = user.isDefined
}

object WineAction extends ActionBuilder[WineActionCtx] {
  override def invokeBlock[A](request: Request[A], block: (WineActionCtx[A]) => Future[Result]): Future[Result] = {
    val isSecured = request.headers.get("X-Forwarded-Protocol").map(_ == "https").getOrElse(request.secure)
    val user = request.session.get("usr").map(Json.parse)
    (Env.env, request.host) match {
      case ("dev", _) => block(WineActionCtx(request, user))
      case (_, "openwinesdatabase.cleverapps.io") if !isSecured => Future.successful(Results.Redirect(s"https://openwinesdatabase.cleverapps.io${request.uri}"))
      case (_, "www.opendatabase.wine") if !isSecured => Future.successful(Results.Redirect(s"https://www.opendatabase.wine${request.uri}"))
      case _ if !isSecured => Future.successful(Results.Redirect(s"https://www.opendatabase.wine${request.uri}"))
      case _ => block(WineActionCtx(request, user))
    }
  }
}
