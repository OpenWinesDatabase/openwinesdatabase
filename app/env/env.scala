package env

import gopf.play.GoodOldPlayframework

object Env extends GoodOldPlayframework {

  def isDev  = gopf.play.api.Play.isDev
  def isProd = gopf.play.api.Play.isProd
  def notDev = !gopf.play.api.Play.isProd
  def hash   = s"${System.currentTimeMillis()}"
  def env    = Configuration.getString("app.env").getOrElse("prod")
  def esServiceURL = Configuration.getString("elasticsearch.service.url").get
  def esServiceLogin = Configuration.getString("elasticsearch.service.login").get
  def esServicePassword = Configuration.getString("elasticsearch.service.password").get

}