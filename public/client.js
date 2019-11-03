$( document ).ready(function() {
  
 
  // add the following to your client.js which is loaded by the page after you've authenticated
  /*global io*/
  var socket = io();
   
  // All users listening to 'user count'
  socket.on('user',function(data){
        console.log(data);          //logs in the browser (client) console
        $('#num-users').text(data.currentUsers + ' users online');
        var message = data.name;
        if(data.connected){
          message += ' has joined the chat.';
        }else{
          message += ' has left the chat.';
        }
        $('#messages').append($('<li>').html('<b>'+message+'</b>'));
      });
  
  
  
  // Form submittion with new message in field with id 'm'
  $('form').submit(function(){
    var messageToSend = $('#m').val();
    //send message to server here?
    socket.emit('chat message', messageToSend);
    $('#m').val('');
    return false; // prevent form submit from refreshing page
  });
  
    //All users listen for chat message
    socket.on('chat message', function(data){
      console.log(data);
      $('#messages').append($('<li>').text(data.name+ ' says: '+data.message));
    });
  
});
