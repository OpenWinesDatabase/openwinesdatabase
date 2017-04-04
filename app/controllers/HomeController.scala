package controllers

import gopf.play.GoodOldPlayframework
import play.api.mvc._

object HomeController extends Controller with GoodOldPlayframework {

  def index = Action {
    Ok(views.html.index())
  }
}
