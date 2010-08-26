


//見たい板の名前とURLを入れていく（名前は適当でもいいけどURLが下記のようなフォーマットでないと読み込みエラーが起きるので注意）
let boards = [
				["news", "kamome.2ch.net/news/"],
				["news4vip", "yuzuru.2ch.net/news4vip/"],
			];


//選択中のスレッド
let thread_number = 0;
function browse(args, bang, count){
	let board = args[0];
	
	let board_url = "";
	for(let [, it] in Iterator(boards)){
		if(board == it[0]){
			board_url = it[1];
			break;
		}
	}
	
	if(typeof args[1] == 'undefined'){
		if(threads_array.length > 0) threads_array = [];
		get2chData(board_url, null);
	}else{
		if(typeof threads_array != 'undefined'){
			if(threads_array.length > 0){
				let number;
				try{
					number = parseInt(args[1], 10) - 1;
				}catch(e){
					liberator.echoerr("should input an accurate numerical value");
				}
				try{
					thread_number = number;
					number = threads_array[number][0];
				}catch(e){
					liberator.echoerr("The number " + number +" thread doesn't exist. ");
				}
				get2chData(board_url, number);
			}else{
				liberator.echoerr("not loaded " +args[0]+ " thread lists!!");
			}
		}
	}
}

function get2chData(url, dat_url){
	if(dat_url){
		url = "http://bg20.2ch.net/test/r.so/" + url + dat_url + "/";
	}else{
		url = "http://" + url + "subject.txt";
	}
	
	let req = new XMLHttpRequest();
	req.overrideMimeType("text/plain; charset=shift_jis");
	req.open("GET", url, true);
	req.setRequestHeader("User-Agent", "Monazilla/1.00 (2ch browser for vimp)");
	
	req.onreadystatechange = function(){
		if(req.readyState == 4){
			if(req.status == 200){
				let threads = req.responseText;
				
				if(dat_url){
					showResponses(threads);
				}else{
					showThreads(threads);
				}
			}else{
				liberator.echoerr("request failed...");
			}
		}
	}
	req.send(null);
}

//thread_arrayからhtml生成
function createHTMLforThreads(threads_array){
	let html = "<style type='text/css'>"
				+ "div{ margin: 0 5px 0 5px; } span{ margin-right:5px; }"
				+"</style>";
	
	for(let [i, thread] in Iterator(threads_array)){
		html += "<div>"
					+ "<span class='num'>" + (i+1) + "</span>"
					+ "<span class='power'>" + thread[3] + "</span>"
					+ "<span class='title'>" + thread[1]+ "</span>"
					+ "<span class='ress'>(" + thread[2] + ")</span>"
				+ "</div>";
	}
	
	return html;
}

//スレッド一覧を出力
let threads_array = [];
function showThreads(threads){
	let getDate = (new Date).getTime();
	getDate = ""+getDate;
	getDate = getDate.substring(0,getDate.length-3);
	getDate = eval(getDate);
	
	//&があるとhtmlが崩れる
	threads = threads.replace(/&/g, "&amp;");
	threads = threads.replace(/\&amp;([a-z]+;)/g, "\&$1");
	
	let result = threads.match(/([0-9]+\.dat)<>(.*)\(([0-9]+)\)/g);
	for(let [, it] in Iterator(result)){
		let m = it.match(/([0-9]+)\.dat<>(.*)\(([0-9]+)\)/);
		//unix時間,スレッドタイトル,レス数,勢いの順に入れる
		threads_array.push([m[1], m[2], m[3], calcPower(getDate, m[1], m[3])]);
	}
	
	threads_array.sort(function(x,y){return y[3]-x[3]});
	liberator.echo(createHTMLforThreads(threads_array), true);
}

//responses_arrayからhtml生成
function createHTMLforResponses(responses_array){
	let html = "<style type='text/css'>"
				+ "div{ margin: 0 5px 0 5px; } span{ margin-right:5px; } div.content{ margin-left:10px; }"
				+"</style>";
	
	html += "<div>"+threads_array[thread_number][1]+"</div>"
	for(let [, it] in Iterator(responses_array)){
		html += "<div>"
					+ "<span class='num'>" + (i+1) + "</span>"
					+ "<span class='name'>" + it[0]+ "</span>"
					+ "<span class='mail'>[" + it[1] + "]</span>"
					+ "<span class='date'>" + it[2] + "</span>"
					+ "<span class='id'>ID:" + it[3] + "</span>"
					+ "<div class='content'>" + it[4] + "</div>"
				+ "</div>";
	}
	
	return html;
}

//スレッド内容を出力
function showResponses(responses){
	let responses_array = new Array();
	
	responses += responses + "\n";
	//&があるとhtmlが崩れる
	responses = responses.replace(/&/g, "&amp;");
	responses = responses.replace(/\&amp;([a-z]+;)/g, "\&$1");
	
	
	try{
	let result = responses.match(/(.*)<>(.*)<>(.*) ID:(.*)<> (.*) <>(.*)\n/)
	if(result){
			let [, name, mail, date, user_id, content] = result;
			
			if (name.match(/<.*>(.*)<.*>/))
				name = RegExp.$1;
			
			//改行タグを修正
			content = content.replace(/<br>/g, "<br/>");
			//name,mail,date,user_id,contentの順に入れる
			responses_array.push([name, mail, date, user_id, content]);
	}
	
	result = responses.match(/(.*)<>(.*)<>(.*) ID:(.*)<> (.*) <>\n/g);
	for(let [, it] in Iterator(result)){
			let [, name, mail, date, user_id, content] = it.match(/(.*)<>(.*)<>(.*) ID:(.*)<> (.*) <>\n/);
			
			if (name.match(/<.*>(.*)<.*>/))
				name = RegExp.$1;
			
			//改行タグを修正
			content = content.replace(/<br>/g, "<br/>");
			//name,mail,date,user_id,contentの順に入れる
			responses_array.push([name, mail, date, user_id, content]);
		}
	}catch(e){
		
	}
	
	liberator.echo(createHTMLforResponses(responses_array), true);
}

//スレッドの勢いを計算する
function calcPower(getDate, createDate, totalRess){
	return ((totalRess / ((getDate-createDate) / 60) ) * 60 * 24).toFixed(2);
}


//第一引数に板の名前、第二引数が無い場合は板一覧・第二引数に板一覧で表示される番号を入力するとスレッドが表示される。
//ex. :jn news
//ex, ;jn news 1
commands.addUserCommand(
	['jn'],
	'2ch browser for vimperator',
	function(args, bang, count){
		browse(args, bang, count);
	},
	{
		completer : function(context, args){
			context.title = ["board title", "url"];
			context.completions = boards;
		}
	},
  true
);
