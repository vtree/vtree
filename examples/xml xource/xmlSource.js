/*jshint multistr:true*/
var xmlSource = '<?xml version="1.0" encoding="UTF-8"?>                               \
<tree id="myDesktop">                                                                 \
  <nodes>                                                                             \
    <node>                                                                            \
      <id>mydesktop_root</id>                                                         \
      <label>My desktop</label>                                                       \
      <description></description>                                                     \
      <icon>../../dist/style/images/folder.png</icon>                                            \
      <hasChildren>true</hasChildren>                                                 \
      <node>                                                                          \
        <id>edit_profile</id>                                                         \
        <label>Edit profile</label>                                                   \
        <description></description>                                                   \
        <action>/vyre4/realms/profile/edit.st8</action>                               \
        <icon>../../dist/style/images/folder.png</icon>                                     \
        <hasChildren>false</hasChildren>                                              \
      </node>                                                                         \
      <node>                                                                          \
        <id>inbox</id>                                                                \
        <label>Inbox</label>                                                          \
        <description></description>                                                   \
        <action>/vyre4/core/inbox.st8</action>                                        \
        <icon>../../dist/style/images/folder.png</icon>                                          \
        <hasChildren>false</hasChildren>                                              \
      </node>                                                                         \
      <node>                                                                          \
        <id>checked_out_items</id>                                                    \
        <label>Checked out items</label>                                              \
        <description></description>                                                   \
        <action>/vyre4/content_module/my-pages/my-checked-out-items.st8</action>      \
        <icon>../../dist/style/images/folder.png</icon>                              \
        <hasChildren>false</hasChildren>                                              \
      </node>                                                                         \
    </node>                                                                           \
  </nodes>                                                                            \
</tree>';
var container = jQuery("#treeContainer");

var settings = {
	container: container,
	dataSource: xmlSource,
	plugins: ["xmlSource"]
};

var start = (new Date).getTime();

var tree = Vtree.create(settings);
//var tree = Vtree.TreeManager.create({container: container2}, jsonSource2)

var diff = (new Date).getTime() - start;

console.log("diff:",diff);

var a = Vtree.getTree(container).nodeStore.structure.id2NodeMap;
var b = 0 ; for (var i in a){b++;}
console.log("nb nodes:",b);











