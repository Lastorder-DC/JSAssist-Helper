// 설정 변수 선언
window.config = {};
window.config.allowTag = true; // 이미지, 스타일, 디시콘등 허용여부. 금지하려면(JSAssist build 17.1 이상 기본설정) false로 변경
window.config.autoReset = false; // [사용안함] 자동리셋 설정 더이상 사용안함
window.config.allowExternalSource = false; //외부이미지([img 주소] 문법) 허용하려면 true로 변경
window.config.allowDCCon = true; //디시콘 사용가능유무 사용금지로 바꾸려면 false로 변경
window.config.ignoreMQDCCon = true; // 마퀴태그+디시콘 사용여부 사용하려면 false로 변경

// 채팅수 관련 설정
window.chat = {};
window.chat.count = 0;
window.chat.maxcount = 50;

// 기타 변수
window.isInited = false;
window.DCCon = {};

// XMLHTTPRequest
var httpRequest;

function addChatMessage2(platform, nickname, message) {
    var style = "style='display:none; '";
    var stylePlatform = "chat_platform_";
    if (platformIcon) {
        stylePlatform += platform;
    } else {
        stylePlatform += "none";
    }
    var chatNickname;
    var msg = "";
    var chatMessage;
    var $chatElement;

    if(platform == "error") chatNickname = "<span class='chat_error_icon'" + style + "/><span class='chat_text_nickname chat_error_nickname' style='display:none'>" + nickname + "</span>";
    else chatNickname = "<span class='" + stylePlatform + "'" + style + "/><span class='chat_text_nickname' style='display:none'>" + nickname + "</span>";
    if(window.config.allowTag) msg = $("<div>" + message + "</div>").html();
    else  msg = $("<div>" + message + "</div>").text();
    if(platform == "error") chatMessage = "<div class='chat_text_message chat_error_message' style='display:none'>" + msg + "</div>";
    else chatMessage = "<div class='chat_text_message' style='display:none'>" + msg + "</div>";
    $chatElement = $(chatNickname + chatMessage + "</div>");

    $chatElement.appendTo($(".chat_container"));
    updateStyle();
    if (animation == "none") {
        $chatElement.show();
    } else {
        $chatElement.show(animation, {easing: "easeOutQuint", direction: "down"});
    }

    window.chat.count++;
    if (chatFade != 0) {
        var fadeTime = chatFade * 1000;
        if (animation == "none") {
            $chatElement.delay(fadeTime).hide(0, function () {
                $(this).remove();
                window.chat.count--;
            });
        } else {
            $chatElement.delay(fadeTime).hide(animation, 1000, function () {
                $(this).remove();
                window.chat.count--;
            });
        }
    } else {
        if (window.chat.count > window.chat.maxcount) {
            window.chat.count--;
            $remove_temp = $(".chat_container span:first-child");
            $remove_temp.next().remove();
            $remove_temp.next().remove();
            $remove_temp.remove();
        }
    }
}

//새로 만들 채팅 함수
//닉네임, 채팅에 적절한 처리를 거친 뒤 원본 채팅함수로 보낸다
//JSAssist가 패치되어 HTML을 거부하게 되면 원본 채팅함수도 후킹해야함
addChatMessage = function (platform, nickname, message) {
    // 닉네임 HTML 제거
    nickname = htmlEntities(nickname);

    // 메세지 HTML 제거
    message = htmlEntities(message);

    // 스크립트 초기화 전에는 기본적인 HTML 필터링만 함
    if(window.isInited) {
        // marquee 태그 변환
        message = message.replace(/\[mq( direction=[^\ ]*)?( behavior=[^\ ]*)?( loop=[^\ ]*)?( scrollamount=[^\ ]*)?( scrolldelay=[^\ ]*)?\](.*)\[\/mq\]/g,replaceMarquee);

        // 메세지 안 디시콘 변환(시동어 ~ 입력후 등록한 이모티콘 이름 입력하면 됨)
        if(window.config.allowDCCon) message = message.replace(/~([^\ ~]*)/g,replaceDCCon);

        //기본문법 변환
        message = replaceStyle(message);
    }

    return addChatMessage2(platform, nickname, message);
};

function replaceStyle(message) {
    //외부 이미지 문법(기본 비활성화 상태로 상단 설정변수를 true로 바꿔 활성화 가능)
    if(window.config.allowExternalSource) message = message.replace(/\[img ([^\]\"]*)\]/g,"<img src=\"$1\" />");

    //닫는태그가 지정된 [b][i][s]
    message = message.replace(/\[b\](.*)\[\/b\]/g,"<b>$1</b>"); //볼드 [b]blah[/b]
    message = message.replace(/\[i\](.*)\[\/i\]/g,"<i>$1</i>"); //이탤릭 [i]blah[/i]
    message = message.replace(/\[s\](.*)\[\/s\]/g,"<strike>$1</strike>"); //취소선 [s]blahp[/s]

    // 나무위키식
    message = message.replace(/'''(.*)'''/g,"<b>$1</b>");
    message = message.replace(/''(.*)''/g,"<i>$1</i>");
    message = message.replace(/~~(.*)~~/g,"<strike>$1</strike>");
    message = message.replace(/--(.*)--/g,"<strike>$1</strike>");
    message = message.replace(/__(.*)__/g,"<u>$1</u>");

    //닫는 태그가 없는 [b][i][s]
    message = message.replace(/\[b\](.*)/g,"<b>$1</b>"); //볼드 [b]blah
    message = message.replace(/\[i\](.*)/g,"<i>$1</i>"); //이탤릭 [i]blah
    message = message.replace(/\[s\](.*)/g,"<strike>$1</strike>"); //취소선 [s]blah

    return message;
}

function replaceMarquee(match,direction,behavior,loop,scrollamount,scrolldelay,body,offset) {
    // 빈 값 확인
    if(typeof direction == "undefined") direction = "";
    if(typeof behavior == "undefined") behavior = "";
    if(typeof loop == "undefined") loop = "";
    if(typeof scrollamount == "undefined") scrollamount = "";
    if(typeof scrolldelay == "undefined") scrolldelay = "";

    // 내용이 빈 mq 태그는 무의미하므로 리턴
    if(typeof body == "undefined") return "";

    var scrollamount_value = scrollamount.replace(/[^0-9]/g,"");

    // scrollamount 값을 50 이하로 제한함(50이 넘으면 50으로 강제 하향조정)
    if(scrollamount_value > 50) scrollamount = ' scrollamount=50';

    // 마퀴태그내 디시콘이 오면 마퀴태그를 무시함
    if(window.config.allowDCCon && window.config.ignoreMQDCCon) {
        // 우선 마퀴태그 내 디시콘을 변환해봄
        body = body.replace(/~([^\ ~]*)/g,replaceDCCon);
        // 디시콘이 있다면 그냥 마퀴태그 없이 변환된 디시콘 이미지만 반환
        if(body.match(/<img/) != null) return body;
    }

    // 마퀴태그 만들어 반환
    return '<marquee' + direction + behavior + loop + scrollamount + scrolldelay + '>' + body + '</marquee>';
}

// 디시콘 변환 함수
function replaceDCCon(match,dcconkey,offset) {
    var dcconimage = window.DCCon;

    //디시콘이 없다면 그냥 반환함
    if(typeof dcconimage[dcconkey] == "undefined") return match;
    else return "<img src=\"" + dcconimage[dcconkey] + "\" >";
}

// HTML 필터링
function htmlEntities(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 디시콘 불러오기 초기화 함수
function initChatInject() {
    // httpRequest 초기화
    if (window.XMLHttpRequest) { // 파폭, 사파리, 크롬 등등 웹표준 준수 브라우저
        httpRequest = new XMLHttpRequest();
    } else if (window.ActiveXObject) { // 쓰레기 IE
        try {
            httpRequest = new ActiveXObject("Msxml2.XMLHTTP");
        }
        catch (e) {
            try {
                httpRequest = new ActiveXObject("Microsoft.XMLHTTP");
            }
            catch (e) {}
        }
    }

    if (!httpRequest) {
        addChatMessage("error","Chat Inject ERROR","Cannot init XMLHTTPRequest");
        return false;
    }

    httpRequest.onreadystatechange = LoadDCCon;
    // !!! 아래 주소를 디시콘 JSON 파일 주소로 바꿔주세요 !!!
    httpRequest.open('GET', "https://openrct2.lastorder.xyz/dccon/list.php");
    httpRequest.send();
}

// 디시콘 불러오기 완료 함수
function LoadDCCon() {
    if (httpRequest.readyState === 4) {
        if (httpRequest.status === 200) {
            try {
                window.DCCon = JSON.parse(httpRequest.responseText);
                window.isInited = true;
            }
            catch (e) {
                addChatMessage("error","Chat Inject ERROR","Unknown error occured while parsing DCCon JSON.");
            }
        } else {
            addChatMessage("error","Chat Inject ERROR","Unknown error occured while downloading DCCon JSON.");
        }
    }
}

initChatInject();
