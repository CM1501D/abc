

//淘宝的js代码
var login={
    init:function(){
        login.bindEvents();
        login.submitTask();
    },
    getDom:{
        loginInput:$('#account'),
        passwordInput:$('#password'),
        loadingDom:$(".loading"),
        submitBtn:$('.telbtns'),
        deleteloginBtn:$('.telNums .deleteTel'),
        deletePasswordBtn:$('.codeCon .deleteTel'),
        showPwdBtn:$('.showCode'),
        submitBtn:$('.nextbtn'),
        checkCodeInput:$(".verifyCode"),
        submitCodeBtn:$('.confirmBtn'),
        checkBtn:$('.check'),

    },
    subFlag:true,//判断点击提交按钮时,调用的是submit任务还是patch任务
    patchFlag:true,//点击提交验证码,调用补充任务接口时,防止用户重复点击按钮,多次调用patch任务
    //初始化事件
    bindEvents:function(){
        //输入手机号码时,显示清空按钮
        login.getDom.loginInput.on('input',function(event) {  
            var len= $.trim($(this).val()).length;
            if(len>0){
                login.getDom.deleteloginBtn.show()
            }else{
                login.getDom.deleteloginBtn.hide()
            }
                
        });
        //清空邮箱账号
        login.getDom.deleteloginBtn.click(function(){
            $(this).parents('.telNums').find('input').val('')
            $(this).hide();
            loginBtnStatus.status.accountStatus = false;
            loginBtnStatus.loginResult(login.getDom.submitBtn);
        })

        //输入邮箱密码时，显示清空按钮
        login.getDom.passwordInput.on('input',function(event) {   
            var len= $.trim($(this).val()).length;
            if(len>0){
                login.getDom.deletePasswordBtn.show();
            }else{
                login.getDom.deletePasswordBtn.hide();
            }
              
        });
        //清空邮箱密码
        login.getDom.deletePasswordBtn.click(function(){
            $(this).prev().val('');
            $(this).hide();
        })

        //显示/隐藏服务密码
        login.getDom.showPwdBtn.click(function(){
            if($(this).hasClass('showCode')){
                $(this).attr('class','hideCode');
                $(this).parents('.codeCon').find('input').attr('type','text');
            }else{
                $(this).attr('class','showCode');
                $(this).parents('.codeCon').find('input').attr('type','password');
            }
            
        })
        //输入短信验证码，下一步按钮是否可用
        $('.verifyCode').on('input',function(){
            var smCodeVal=$.trim($(this).val()).length;
            if(smCodeVal>0){
                $('.confirmBtn').addClass('active');
            }else{
                $('.confirmBtn').removeClass('active');
            }
        })

        //邮箱账号输入时查看提交按钮是否可用
        login.getDom.loginInput.on('input',function(){
            loginBtnStatus.resultStatus(login.getDom.loginInput,"accountStatus",login.getDom.submitBtn);
        })
        //邮箱密码输入时查看提交按钮是否可用
        login.getDom.passwordInput.keyup(function(){
            loginBtnStatus.resultStatus(login.getDom.passwordInput,"passwordStatus",login.getDom.submitBtn);
        })
         //同意授权
        login.getDom.checkBtn.click(function(){
             
             var ele = $(this);
             if(ele.hasClass('uncheck')){
                 ele.removeClass('uncheck');
                 
             }else{
                 ele.addClass('uncheck')
                
             }
             loginBtnStatus.status.checkStatus = !loginBtnStatus.status.checkStatus;
             loginBtnStatus.loginResult(login.getDom.submitBtn);

         })
    },
    //提交任务接口
    submitTask:function(){

        login.getDom.submitBtn.click(function(){
            if(!login.getDom.submitBtn.hasClass('select')){
            
             return;
            }

            var emailBill_account=login.getDom.loginInput.val();
            var emailBill_password=login.getDom.passwordInput.val();
            var emailBill_account_len=$.trim(login.getDom.loginInput.val()).length;
            var emailBill_password_len=$.trim(login.getDom.passwordInput.val()).length;

            if(emailBill_account_len==0){
                layer('邮箱账号不能为空');
                return;
            }
            if(emailBill_password_len==0){
                layer('邮箱密码不能为空');
                return;
            }
            var dataJson = {
                "loginType":0,
                "account": emailBill_account,
                "password":emailBill_password
            }
            if(login.subFlag){
               $.ajax({
                   url: appurl+"/fig/v1/submit?appKey="+appkey+"&taskType=email_bill&ak="+ak+"&openId="+oppenId,
                   type: "post",
                   dataType: 'json',
                   contentType: "application/json;",
                   data: JSON.stringify(dataJson),
                   success: function (data) {
                       if(data.status==300){
                           $(".loading").hide();
                           var messages,resultData;
                           if(data.data){
                               resultData = JSON.parse(data.data);
                               messages = resultData.message;
                           }else{
                               messages = data.msg;
                           }
                          $('.dialog').show();
                          $('.info-dialog').text(messages);
                          return false; 
                       }
                       login.getDom.loadingDom.hide();


                       if(data.status==200){
                           var resultData = JSON.parse(data.data);
                           //不等于0表示失败
                           if (resultData.code == null || resultData.code != "general_0") {
                               $('.dialog').show();
                               $('.info-dialog').text(resultData.message);
                               login.subFlag=true;
                           } else {//成功
                               var taskNo = resultData.taskNo;   //拿到taskNo
                               if (resultData.taskStatus == "processing") {
                                   login.getDom.loadingDom.show();
                                   setTimeout(function(){
                                       login.pollTask(appkey,taskNo,ak);
                                   },5000)
                                   
                               }else{
                                   alert('提交任务的其他状态');
                               }
                           }
                       }else{
                           $('.dialog').show();
                           $('.info-dialog').text(data.msg);
                       }
                   }
               }); 
               login.subFlag=false;
            }
            
        })
        
    },
    /**
     * 轮询查询接口
     * @param appkey
     * @param taskNo
     * @param ak
     */
    pollTask:function(appkey,taskNo,ak){
        var data = {
            "appKey":appkey,
            "taskNo": taskNo,
            "ak":ak
        };
        $.ajax({
            type: "post",
            url: appurl+"/fig/v1/pollingCallback",
            data:data,
            success: function (data) {
                if (data.status == 200) {
                    if(data.data==null){

                        setTimeout(function(){
                            login.pollTask(appkey,taskNo,ak);
                        },5000);
                    }else{
                        var resultData = JSON.parse(data.data);
                        
                        if(resultData.taskStatus=="processing"){
                            setTimeout(function(){
                                
                                login.pollTask(appkey,taskNo,ak);
                            },5000);
                        }else if(resultData.taskStatus=="tofinish"){
                            $('.picCodeShade').hide();
                            $('.confirmBtn').text('确定');
                            $('.confirmBtn').next().hide();
                            $('.loading_operator').show();
                            $('.loading').hide();
                            setTimeout(function(){
                                
                                login.pollTask(appkey,taskNo,ak);
                            },5000);
                        }else if(resultData.taskStatus=="pending"){ 
                            var code=resultData.code;
                            $('.loading').hide();
                            $('.loading_operator').hide();
                            login.handlependingTask(resultData,appkey,taskNo,ak)
                            login.patchFlag=true;
                            // login.getDom.submitBtn.off('click').on("click",function(){

                            //     bodyData = typeof bodyData == 'function' ? bodyData() : bodyData;
                            //     sessionStorage.setItem('userName', $input.eq(0).val());
                            //     login.patchTask(appkey,taskNo,ak,bodyData);

                            // });
                        
                        }else if(resultData.taskStatus=="fail"){
                            $('.loading_operator').hide();
                            $('.loading').hide();
                            $('.confirmBtn').text('确定');
                            $('.confirmBtn').next().hide();
                            $('.picCodeShade').hide();
                            $('.dialog').show();
                            $('.info-dialog').text(resultData.message)    
                            $('input').removeAttr('disabled');
                            login.subFlag=true;
                        }else if(resultData.taskStatus=="success"){
                            $('.loading_operator').hide()
                            $('.loading').hide();
                            $('.confirmBtn').text('确定');
                            $('.confirmBtn').next().hide();
                            login.getDom.loadingDom.hide();
                            var taskResult=resultData.taskResult;
                            window.location.href="./infoCon.html?appkey="+appkey+"&taskNo="+taskNo+"&ak="+ak;
                         
                        }else if(resultData.taskStatus=="tofinish"){
                            $('.confirmBtn').text('确定');
                            $('.confirmBtn').next().hide();
                            $('.picCodeShade').hide();
                            $('.loading_operator').show();
                            $('.loading').hide(); 
                            setTimeout(function(){
                                login.pollTask(appkey,taskNo,ak);
                            },5000);
                        }
                    }
                }else {
                    $('.dialog').show();
                    $('.info-dialog').text(data.msg);
                    
                }

            }
        });
    },
    /**
     * 补充任务接口
     * @param appkey
     * @param taskNo
     * @param ak
     */
    patchTask:function(appkey,taskNo,ak,bodyData){
        $.ajax({
            type: "post",
            contentType: "application/json",
            url: appurl+"/fig/v1/patch?appKey=" + appkey + "&taskNo=" + taskNo + "&ak=" + ak,
            data: JSON.stringify(bodyData),
            success: function (data) {
                
                if (data.status == 200) {
                    var resultData = JSON.parse(data.data);
                    if (resultData.code == "general_0"&&resultData.taskStatus=="processing") {
                        if($('.picCodeShade').css('display')=='block'){
                            $('.confirmBtn').text('');
                            $('.confirmBtn').next().show();
                        }else{
                            $('.loading').show()
                        }
                        setTimeout(function(){
                            login.pollTask(appkey, taskNo, ak);
                        },5000)
                        
                    }else{

                       login.patchFlag=true;
                       $('.loading_operator').hide();
                       $('.btn-dialog').text('重新加载');
                       $(".info-dialog").text(resultData.message);
                       $('.dialog').show();
                       $('.confirmBtn').text('确定');
                       $('.confirmBtn').next().hide();
                    }
                } else {
                    $('.dialog').show();
                    $('.info-dialog').text(data.msg);
                }
            },
            error: function(xhr) {
                $('.dialog').show();
                $('.info-dialog').text(xhr);
            }
        });
    },  

    handlependingTask:function(resultData,appkey,taskNo,ak){
        switch(resultData.code){
            //账户密码错误
            case "email_bill_2":
                 $('.picCodeShade,.smCodeShade').hide();
                 $('.confirmBtn').text('确定');
                 $('.confirmBtn').next().hide();
                 $('.dialog').show();
                 $(".info-dialog").text(resultData.message);
                 login.getDom.checkCodeInput.removeAttr('disabled');
                 login.getDom.submitBtn.unbind().click(function(){
                    var account=$.trim(login.getDom.loginInput.val());
                    var password=$.trim(login.getDom.passwordInput.val());
                    var bodyData={
                        'patchCode':2005,
                        'data':{
                            'account':account,
                            'password':password
                        }
                    }
                    if(login.patchFlag){
                        login.patchTask(appkey,taskNo,ak,bodyData);
                        login.patchFlag=false;
                    }
                    
                 })   
            break;

            //QQ邮箱需要独立密码登录
            case "email_bill_4":
                $('.picCodeShade').hide();
                $('.confirmBtn').text('确定');
                $('.confirmBtn').next().hide();
                $('.smCodeShade').show();
                $('.smCodeShade .tipArea').text('QQ邮箱需要独立密码,请输入');
                login.getDom.checkCodeInput.removeAttr('disabled');
                login.getDom.submitCodeBtn.unbind().click(function(){
                    //var password=$.trim(login.getDom.passwordInput.val());
                    var password=$.trim($('#checkCode').val());
                    var bodyData={
                        'patchCode':2011,
                        'data':password
                    }
                    if(login.subFlag){
                       login.patchTask(appkey,taskNo,ak,bodyData);
                       login.patchFlag=false;
                    }
                    
                })
            break;

            //QQ邮箱独立密码错误
            case "email_bill_5":
                $('.picCodeShade').hide();
                $('.smCodeShade').show();
                $('.smCodeShade .tipArea').text('QQ邮箱独立密码错误,请重新输入');
                $('.confirmBtn').text('确定');
                $('.confirmBtn').next().hide();
                login.getDom.checkCodeInput.removeAttr('disabled');
                login.getDom.submitCodeBtn.unbind().click(function(){
                    var password=$.trim(login.getDom.passwordInput.val());
                    var bodyData={
                        'patchCode':2011,
                        'data':password
                    }
                    if(login.patchFlag){
                        login.patchTask(appkey,taskNo,ak,bodyData);
                        login.patchFlag=false;
                    }
                    
                }) 
            break;

            //输入图片验证码
            case "email_bill_6":
                $('.picCodeShade').show();
                $('.smCodeShade').hide();
                $('.tipArea').text('请输入图片验证码');
                $('.confirmBtn').text('确定');
                $('.confirmBtn').next().hide();
                $('.verifyImg').attr('src',resultData.data);
                login.getDom.checkCodeInput.removeAttr('disabled');
                login.getDom.submitCodeBtn.unbind().click(function(){
                    var picCode=$.trim(login.getDom.checkCodeInput.val());
                    var bodyData={
                        'patchCode':2002,
                        'data':picCode
                    }
                    if(login.patchFlag){
                        login.patchTask(appkey,taskNo,ak,bodyData);
                        login.patchFlag=false;
                    }
                    
                }) 
            break;

            //图片验证码错误
            case "email_bill_7":
               $('.picCodeShade').show();
               $('.smCodeShade').hide();
               $('.tipArea').text('图片验证码错误,请输入新的验证码');
               $('.confirmBtn').text('确定');
               $('.confirmBtn').next().hide();
               $('.verifyImg').attr('src',resultData.data);
               login.getDom.checkCodeInput.removeAttr('disabled');
               login.getDom.submitCodeBtn.unbind().click(function(){
                    var picCode=$.trim(login.getDom.checkCodeInput.val());
                    var bodyData={
                        'patchCode':2002,
                        'data':picCode
                    }
                    if(login.patchFlag){
                        login.patchTask(appkey,taskNo,ak,bodyData);
                        login.patchFlag=false;
                    }
                    
                }) 
            break;
           
        }
    }

}

//初始化函数
$(function(){
    login.init();
});
