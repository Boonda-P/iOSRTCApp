var app = {
    initialize: function() {
        console.error = window.onerror = function() {
            if (JSON.stringify(arguments).indexOf('iosrtc') !== -1) {
                return;
            }

            if (JSON.stringify(arguments).indexOf('No Content-Security-Policy') !== -1) {
                return;
            }

            if (JSON.stringify(arguments).indexOf('<') !== -1) {
                return;
            }

            alert(JSON.stringify(arguments, null, ' '));
        };

        app.bindEvents();
    },
    bindEvents: function() {
        document.addEventListener('deviceready', app.onDeviceReady, false);
        document.addEventListener('resume', function() {
            if (window.connection && connection.getAllParticipants().length) {
                return;
            }
            location.reload();
        }, false);

        document.addEventListener('online', function() {
            location.reload();
        }, false);

        document.addEventListener('offline', function() {
            alert('Seems disconnected.');
        }, false);

        document.querySelector('.btn-leave-room').onclick = function() {
            if(window.connection) {
                try {
                    window.connection.attachStreams.forEach(function(stream) {
                        stream.stop();
                    });
                    
                    window.connection.close();
                }
                catch(e){}

                window.connection = null;
            }
            location.reload();
        };
    },
    onDeviceReady: function() {
        // loadRTCMultiConnection.js => RTCMultiConnection-v3 MUST be loaded after when device is ready.
        loadRTCMultiConnection();

        // now you can use RTCMultiConnection v3 APIs
        app.yourCustomCode();
    },
    yourCustomCode: function() {
        // this is your custom javascript code

        // ......................................................
        // .......................UI Code........................
        // ......................................................
       

        document.getElementById('open-or-join-room').onclick = function() {
            disableInputButtons();
            connection.openOrJoin(document.getElementById('room-id').value);
        };

        // ......................................................
        // ..................RTCMultiConnection Code.............
        // ......................................................

        window.connection = new RTCMultiConnection();

        // by default, socket.io server is assumed to be deployed on your own URL
        // connection.socketURL = '/';

        // comment-out below line if you do not have your own socket.io server
        connection.socketURL = 'https://cwcwebrtc.herokuapp.com:443/';

        connection.socketMessageEvent = 'video-conference-demo';

        connection.session = {
            audio: true,
            video: true
        };

        connection.sdpConstraints.mandatory = {
            OfferToReceiveAudio: true,
            OfferToReceiveVideo: true
        };

        connection.videosContainer = document.getElementById('videos-container');
        connection.onstream = function(event) {
            var width = parseInt(connection.videosContainer.clientWidth / 2) - 20;
            var mediaElement = getMediaElement(event.mediaElement, {
                title: event.userid,
                buttons: ['full-screen'],
                width: width,
                showOnMouseEnter: false,
                onStopped: function() {
                    if(event.userid === connection.userid) return;
                    connection.disconnectWith(event.userid);
                }
            });

            connection.videosContainer.appendChild(mediaElement);

            setTimeout(function() {
                mediaElement.media.play();
            }, 5000);

            mediaElement.id = event.streamid;
        };

        connection.onstreamended = function(event) {
            var mediaElement = document.getElementById(event.streamid);
            if (mediaElement) {
                mediaElement.parentNode.removeChild(mediaElement);
            }
        };

        function disableInputButtons() {
            document.getElementById('open-or-join-room').disabled = true;
            document.getElementById('room-id').disabled = true;
        }

        // ......................................................
        // ......................Handling Room-ID................
        // ......................................................

        var roomid = '';
        if (localStorage.getItem(connection.socketMessageEvent)) {
            roomid = localStorage.getItem(connection.socketMessageEvent);
        } else {
            roomid = connection.token();
        }
        document.getElementById('room-id').value = roomid;
        document.getElementById('room-id').onkeyup = function() {
            localStorage.setItem(connection.socketMessageEvent, this.value);
        };
    }
};

app.initialize();
