<?php
$data=$_GET;
$doc=db.chat.find_one({"_id":room});
$initiator=1;
if(!doc)
{
	$initiator=0;
	doc={"_id":room,"mess":[]};
	db.chat.save(doc);
}
return templ('rtc.tpl',initiator=initiator,room=room)
?>