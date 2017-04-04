package controllers

import actions.WineAction
import gopf.play.GoodOldPlayframework
import play.api.mvc._

object HomeController extends Controller with GoodOldPlayframework {

  implicit val ec = defaultContext
  implicit val mat = defaultMaterializer

  def index = WineAction { ctx =>
    Ok(views.html.index(ctx.user))
  }

  def spa(path: String) = WineAction { ctx =>
    Ok(views.html.index(ctx.user))
  }
}
