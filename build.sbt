name := """OpenWinesDatabase"""
organization := "org.openwinedatabase"
version := "1.0.0-SNAPSHOT"
scalaVersion := "2.11.8"

lazy val root = (project in file("."))
  .enablePlugins(PlayScala)
  .settings(Javascript.buildUiSettings)

libraryDependencies ++= Seq(
  ws,
  cache,
  filters,
  "org.reactivecouchbase" %% "good-old-play-framework" % "1.0.3",
  "org.scalatestplus.play" %% "scalatestplus-play" % "1.5.1" % Test
)

resolvers += "bintray" at "http://jcenter.bintray.com"
resolvers += "good-old-play-framework repository" at "https://raw.githubusercontent.com/mathieuancelin/good-old-play-framework/master/repository/releases"
resolvers += "reactivecouchbase-repo" at "https://raw.github.com/ReactiveCouchbase/repository/master/snapshots/"

PlayKeys.devSettings := Seq("play.server.http.port" -> "9000")
routesGenerator := StaticRoutesGenerator
sources in (Compile, doc) := Seq.empty
publishArtifact in (Compile, packageDoc) := false
