module.exports.createPost=(req,res,next)=>{
    if(!req.body.fullname || !req.body.email || !req.body.password || !req.body.phone || !req.body.roleId){
    req.flash('error','Vui lòng nhập đầy đủ thông tin')
    res.redirect('back')
    return
  }
  next();
}
module.exports.editPatch=(req,res,next)=>{
    if(!req.body.fullname ){
    req.flash('error','Vui lòng nhập họ tên')
    res.redirect('back')
    return
  }
    if(!req.body.email ){
    req.flash('error','Vui lòng nhập email')
    res.redirect('back')
    return
  }
  next();
}