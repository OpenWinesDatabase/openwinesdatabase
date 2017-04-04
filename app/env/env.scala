package env

object Env extends gopf.play.GoodOldPlayframework {

  lazy val isDev = gopf.play.api.Play.isDev
  lazy val isProd = gopf.play.api.Play.isProd
  lazy val notDev = !gopf.play.api.Play.isProd
  lazy val hash = s"${System.currentTimeMillis()}"	
  lazy val env = Configuration.getString("app.env").getOrElse("prod")
}