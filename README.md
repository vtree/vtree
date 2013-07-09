Vtree.js is a Javascript component for rendering trees in browser.
It supports, ajax lazy loading, checkboxes and cookies.

Many thanks to Vyre ltd. for sponsoring this component
http://www.vyre.com


DOCUMENTATION:
==============
For Docs and downloads, see:
http://loicginoux.github.com/vtree/


RELASE NOTES:
=============

v1.1.2 (5.07.2013)
-----------------
- issue #67. correction of a corner case behaviour
- issue #65 ontext menu is not preventing default, this is let to the user to prevent or not
- correct issue #63 initiallyOpen not working when multiple tree in page
- correct issue #64 triggerring "OpenNodesFromCookie" the first time trees render

v1.1.1 (5.06.2013)
-----------------

### new features:
1. #58 Ability to add href to 'a' link tag on a node. If a HREF attribute exists in the incoming JSON structure it should be supplanted into the A tag to build a link

Eg

```
{...

'href':'home.html'

...
}
```

produces

```
<a href="home.html">node name</a>
```

2. #56 Add a unique id for each node
3. #48 use of text() instead of html() to include the title of the node in order to prevent code injection.
4. #53 in ajax plugin, ignore nodes that haven't been sent back by the server (in the case they are requested by the framework and have been deleted in the server.)

### smaller issues

60, #57, #50, #42, #35, #8


v1.1 (11.02.2013)
-----------------

###  new features:

1. deleted bolding plugin (supported in the checkbox plugin)
	- checkbox plugin: new tree parameter "displayCheckbox". type: Boolean. this will display or not the checkbox
	- checkbox plugin: if "displayCheckbox" is set to true, clicking the node will put the node in a checked state
	- checkbox plugin: new tree parameter: "checkedClass". set by default to "checked". this is the class added to the li element when the node is checked

2. checkbox plugin: possibility to automatically check and/or uncheck parents and/or children of a node, see #45
	- checkbox plugin: new tree parameter "checkBehaviour". that can be set to "checkParents" or "checkChildren" or false. depending on this state, when checking a node, it will automatically check his parents or children or not do anything else.
	- checkbox plugin: new tree parameter "uncheckBehaviour". that can be set to "uncheckParents" or "uncheckChildren" or false. depending on this state, when unchecking a node, it will automatically uncheck his parents or children or not do anything else.
	- checkbox plugin: new tree parameter "disableBehaviour". that can be set to "disableParents" or "disableChildren" or false. depending on this state, when disabling a node, it will automatically disabling his parents or children or not do anything else.
	- checkbox plugin: now the events "check.node" and "uncheck.node" has another boolean parameter called passed to the function handler to let it know if the event has been triggered automatically (set to true) or manually (set to false), i.e. triggered by the user.
3. unification of attributes to camel case (changes to initially_checked, initially_open)

4. ajax plugin: handle response in the order they were requested #40

5. checkbox plugin: deep initial selection #43
 - when using checkbox plugin and ajax plugin, if we set a node in the parameter "initiallyChecked" that is not yet loaded, it will be passed into the list of checked nodes when calling tree.getCheckedNodes() and when opening his parent, it will be loaded in a checked state.

6. ajax loading plugin: new event "afterChildrenLoaded.node" triggered after we open a node that gets it children loaded from the server and they get displayed on the page. the parameters passed to the handler function is the event, the tree and the node just opened.

7. checkbox plugin: new tree parameter: "disabledClass". set by default to "disabled". this is the class added to the li element when the node is disabled


### issues solved:
- #44: uncheck.node event should be triggered after the data structure has changed
- #46: Right click does not send the node

v1.0 (15.09.2013)
-----------------
first edition


LICENSE:
========

Copyright (c) 2012-2013 Loic Ginoux, Vyre ltd.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
