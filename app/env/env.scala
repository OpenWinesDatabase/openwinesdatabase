package env

import gopf.play.GoodOldPlayframework

case class Auth0Config(secret: String, clientId: String, callbackURL: String, domain: String)

object Env extends GoodOldPlayframework {

  def isDev  = gopf.play.api.Play.isDev
  def isProd = gopf.play.api.Play.isProd
  def notDev = !gopf.play.api.Play.isProd
  def hash   = s"${System.currentTimeMillis()}"
  def env    = Configuration.getString("app.env").getOrElse("prod")
  def esServiceURL = Configuration.getString("elasticsearch.service.url").get
  def esServiceLogin = Configuration.getString("elasticsearch.service.login").get
  def esServicePassword = Configuration.getString("elasticsearch.service.password").get

  def auth0Config = Auth0Config(
    Configuration.getString("app.auth0.clientSecret").get,
    Configuration.getString("app.auth0.clientId").get,
    Configuration.getString("app.auth0.callbackUrl").get,
    Configuration.getString("app.auth0.domain").get
  )

}