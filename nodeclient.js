var io = require('socket.io-client')('http://192.168.0.15:3000');

var exec_photo = require('child_process').exec;
var photo_path = __dirname+"/Pictures/"+Date.now()+'.jpg'
var cmd_photo = 'raspistill -o '+photo_path;
var fs = require('fs');
var base64 = require('node-base64-image');

var Gpio = require('onoff').Gpio,
    ledin = new Gpio(4, 'out'),
    ledout = new Gpio(17,'out'),
    locker = new Gpio(18, 'out'),
    micros = new Gpio(22, 'in','both'),
    laser = new Gpio(20, 'out'),
    ldr = new Gpio(21, 'in');

var myObj = {};

var lockerclose = function(){
	locker.write(0, function(err) {
		if(err){
			throw err;
		}
	});
	locker.write(1, function(err) {
		if(err){
			throw err;
		}
	});
}

var lockeropen = function(){
  locker.write(1, function(err) {
		if(err){
			throw err;
		}
	});
	locker.write(0, function(err) {
		if(err){
			throw err;
		}
	});
}


io.on('connect',function(){
   console.log("connect");
   
});

io.on('rasp_lock', function(data){
	var send_data = {};
	send_data.id = data.id;
  console.log(data);
  //locker.writeSync(data);
  if(data.lock == 0)
 {
	lockeropen();
	send_data.lock = 1;
 }
 else
  {
	lockerclose();
	send_data.lock = 0;
  }
  io.emit('rasp_response', send_data);
  
});

//take photo function
io.on('rasp_photo', function(data){
        //turn on ledin before taking photo
        ledin.writeSync(1);
        //execute raspistill
	exec_photo(cmd_photo, function(error, stdout, stderr){
	 ledin.writeSync(0);
  	 base64.encode(photo_path,{local:true},function(err,x){
         myObj.image = x;
	 myObj.user_id = data.user_id;
	 myObj.box_id = data.box_id;
        // console.log(myObj);
        console.log('receive server message');
	io.emit('photo_res',myObj);           
   });
  });
	
});

/*
io.on('upload', function(data){
  var send_data = {};
  if(data.shot == 1){

   send_data['micros'] = micros.readSync();
   send_data['ledout'] = ledout.readSync();
   send_data['ledin'] = ledin.readSync();
   send_data['locker'] = locker.readSync();
   send_data['photosen'] = ldr.readSync();

   io.emit('sensor', send_data); }//if

}); */
