var io = require('socket.io-client')('http://192.168.0.15:3000');

var exec_photo = require('child_process').exec;
var photo_path = __dirname+"/Pictures/"+Date.now()+'.jpg'
var cmd_photo = 'raspistill -o '+photo_path+' -t 1000';
var fs = require('fs');
var base64 = require('node-base64-image');

var Gpio = require('onoff').Gpio,
    ledin1 = new Gpio(4, 'out'),
    ledin2 = new Gpio(26, 'out'),
    ledin3 = new Gpio(19, 'out'),
    ledin4 = new Gpio(13, 'out'),
    ledout = new Gpio(17,'out'),
    locker = new Gpio(18, 'out'),
    micros = new Gpio(22, 'in','both'),
    laser = new Gpio(20, 'out'),
    ldr = new Gpio(21, 'in');

var myObj = {};

var using = 0;

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

//box set up
var setbox = function(){
   laser.writeSync(0);
   micros.watch(function(err,value) {
	if(err){
		throw err;
	}
	//if opened
	if(value == 1){
	  ledin1.writeSync(1);
          ledin2.writeSync(1);
          ledin3.writeSync(1);
          ledin4.writeSync(1);
	  }
        //if closed
	else{
	  ledin1.writeSync(0);
          ledin2.writeSync(0);
          ledin3.writeSync(0);
          ledin4.writeSync(0);
        }
   });
}
//setbox();

//connect to server
io.on('connect',function(){
   console.log("connect");
   
});

//lock 
io.on('rasp_lock', function(data){

if(data.box_id == 1) {

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

}
  
});

//take photo function
io.on('rasp_photo', function(data){
        //turn on ledin before taking photo
        ledin1.writeSync(1);
        ledin2.writeSync(1);
        ledin3.writeSync(1);
        ledin4.writeSync(1);
        
        //execute raspistill
	exec_photo(cmd_photo, function(error, stdout, stderr){
	 ledin1.writeSync(0);
         ledin2.writeSync(0);
         ledin3.writeSync(0);
         ledin4.writeSync(0);

  	 base64.encode(photo_path,{local:true},function(err,x){
         myObj.image = x;
	 myObj.user_id = data.user_id;
	 myObj.box_id = data.box_id;
         console.log(myObj);
        console.log('receive server message');
	io.emit('photo_res',myObj);           
   });
  });
	
});


var dataread = setInterval(function(){
  var send_data = {};
   send_data.box_id = 1;
   send_data['micros'] = micros.readSync();
   send_data['ledin'] = ledin1.readSync();
   send_data['ledout'] = ledout.readSync();
   send_data['lock'] = locker.readSync();
   send_data['photosen'] = ldr.readSync();

   io.emit('upload', send_data); 

	
 }, 3000); 

