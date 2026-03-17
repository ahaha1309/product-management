module.exports.loginPost=(req,res,next)=>{
    if(!req.body.email || !req.body.password ){
    req.flash('error','Vui lòng nhập đầy đủ thông tin')
    res.redirect('back')
    return
  }
  next();
}