import com.typesafe.sbt.packager.Keys._
import sbt.Keys._
import sbt._

/**
  * Should be located in in myApp/project/javascript.scala
  *
  * To use it from your `build.sbt` file,
  * just add the JS build setting to the project
  *
  * {{{
  *   lazy val root = (project in file("."))
  *     .enablePlugins(PlayJava)
  *     .settings(Javascript.buildUiSettings)
  * }}}
  *
  * or
  *
  * {{{
  *   lazy val root = (project in file("."))
  *     .enablePlugins(PlayScala)
  *     .settings(Javascript.buildUiSettings)
  * }}}
  */
object Javascript {

  val javascriptDirectory = SettingKey[File]("javascript-assets-directory")
  val javascriptBuild = TaskKey[Int]("js-build")
  val buildScript = """
                      |if [ -n "$BUILD_JS" ] && [ "$BUILD_JS" == "true" ]; then
                      |    echo "On CleverCloud, sourcing nvm"
                      |    source /home/bas/.nvm/nvm.sh
                      |    echo "using latest node version (7.5.0)"
                      |    nvm install 7.5.0
                      |    nvm use 7.5.0
                      |    echo "Installing Yarn"
                      |    npm install -g yarn
                      |    echo "Installing JS deps"
                      |    yarn install
                      |    echo "Running JS build"
                      |    yarn run build
                      |    echo "Destroying dependencies cache"
                      |    rm -rf ./node_modules
                      |fi
                    """.stripMargin

  val buildUiSettings = Seq(
    javascriptDirectory <<= (baseDirectory in Compile) { _ / "javascript" },
    commands <++= javascriptDirectory { base => Seq(npmCommand(base), yarnCommand(base), buildUiCommand(base)) },
    javascriptBuild := Process(List("/bin/sh", "-c", buildScript), javascriptDirectory.value).run().exitValue(),
    stage <<= stage dependsOn javascriptBuild
  )

  def npmCommand(base: File) = Command.args("npm", "<npm-command>") { (state, args) =>
    Process("npm" :: args.toList, base) !;
    state
  }

  def yarnCommand(base: File) = Command.args("yarn", "<yarn-command>") { (state, args) =>
    Process("yarn" :: args.toList, base) !;
    state
  }

  def buildUiCommand(base: File) = Command.command("buildUi") { state =>
    Process(List("/bin/sh", "-c", buildScript), base) !;
    state
  }
}