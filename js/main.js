var app, rdio,
	PRODUCTION = location.host.indexOf('mit.edu') > -1,
	WAMI_API_KEY = PRODUCTION ?
		'79f691fb6aa76373f9e27e8141c46244' : // web.mit.edu
		'bdc9a99b5c3040a52085a805a750a788',
	SONG_KEY = 'p593',
	RDIO_API_KEY = PRODUCTION ?
		'GAtQV9JaAB8oJWR2cHlzNHd5ZXg3Z2M0OXdoaDY3aHdrbndlYi5taXQuZWR1fznPhochjLih8Tuo45FA1w==' : // web.mit.edu
		'GAlQV84vAB8oJWR2cHlzNHd5ZXg3Z2M0OXdoaDY3aHdrbmxvY2FsaG9zdDyE4GUoFCbj20JwxWIa1Ps=';
$(function() {
	// JSGF grammar
	var jsgf = 
		"#JSGF V1.0;\n"+
		"grammar RdioPlayer;\n"+
		"public <top> = <command>;\n"+
		"<command> = (stop {[cmd=stop]} [<radio>] |\n"+
		"	(play | start | resume) {[cmd=play]} [<radio>] |\n"+
		"	pause {[cmd=pause]} [<radio>] |\n"+
		"	previous {[cmd=previous]} [<song>] |\n"+
		"	(next | skip) {[cmd=next]} [<song>] |\n"+
		"	shuffle {[cmd=shuffle]} [<song>]\n"+
		"	);\n"+
		"<song> = track | song | jam;\n"+
		"<radio> = music | radio | <song>;";

	var grammar = {
		language : "en-us", 
		grammar : jsgf,
		aggregate : true
	};

	var rdioReady = false,
		isPlaying = false,
		paused = false,
		duration = 1;

	rdio = $('#rdio').rdio(RDIO_API_KEY);
	$('#rdio').on('positionChanged.rdio', function(e, position) {
		// console.error(position);
		// $('#position').css('width', Math.floor(100*position/duration)+'%');
	});

	$('#rdio').on('playingTrackChanged.rdio', function(e, playingTrack, sourcePosition) {
		if (playingTrack) {
			duration = playingTrack.duration;
			$('#art').attr('src', playingTrack.icon);
			$('#track').text(playingTrack.name);
			$('#album').text(playingTrack.album);
			$('#artist').text(playingTrack.artist);
		}
	});

	var execCmd = function(cmd) {
		switch (cmd) {
			case 'play':
				if (paused) {
					rdio.play();
				} else {
					rdio.play(SONG_KEY);
				}
				isPlaying = true;
				paused = false;
				break;
			case 'stop':
				rdio.stop();
				paused = false;
				isPlaying = false;
				break;
			case 'pause':
				if (isPlaying) {
					rdio.pause();
					paused = true;
					isPlaying = false;
				}
				break;
			case 'previous':
				rdio.previous();
				break;
			case 'next':
				rdio.next();
				break;
			case 'shuffle':
				rdio.setShuffle(true);
				rdio.next();
				break;
		}
	};

	// Handlers are functions which are called for various events:
  	var options = {
		guiID: 'AudioContainer',
		devKey: WAMI_API_KEY,
		grammar: grammar,
		onReady: function() {},
		onRecognition: function(result) {
			var command = result.get('cmd'),
				text = result.text();
			$('#command').text(text + "\n");
			execCmd(command);

			// app.playback();
			// app.speak(hyp); // Speech synthesis of what we heard
			// setTimeout("app.playback()", 500); // play back audio we recorded
		},
		onError: function(type, message) {
			console.error("WAMI error: type  = " + type + ", message = " + message);	
		},
		onTimeout: function() {},
		onEvent: function(state, event, data) {
			if (rdioReady) {
				if (state == Wami.state.RECORD) {
					rdio.setVolume(0.2);
				} else if (state == Wami.state.IDLE) {
					rdio.setVolume(1);
				}
			}
		}
	};

	app = new Wami.App(options);

	$('#rdio').on('ready.rdio', function(event, userinfo) {
		console.log('RDIO INFO', userinfo);
		rdioReady = true;
	});
});