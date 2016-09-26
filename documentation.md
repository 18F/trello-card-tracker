 Classes

<dl>
<dt><a href="#MyTrello">MyTrello</a></dt>
<dd><p>Class that encapsulates Trello configuration and calls.</p>
</dd>
<dt><a href="#StageManager">StageManager</a></dt>
<dd><p>The StageManager class handles the initial setup
  of a board for use as an ADS BPA tracker, based
  on the configuration YAML file.</p>
</dd>
</dl>

<a name="MyTrello"></a>

 MyTrello
Class that encapsulates Trello configuration and calls.

**Kind**: global class  

* [MyTrello](#MyTrello)
    * [new MyTrello(yamlFile, board)](#new_MyTrello_new)
    * [.readYaml()](#MyTrello+readYaml) ⇒ <code>object</code>
    * [.getPreAward()](#MyTrello+getPreAward) ⇒ <code>Array</code>
    * [.getListIDbyName(name)](#MyTrello+getListIDbyName) ⇒ <code>Promise.&lt;(string\|Error)&gt;</code>
    * [.getListNameByID(id)](#MyTrello+getListNameByID) ⇒ <code>Promise.&lt;(string\|Error)&gt;</code>
    * [.getMember(usernameOrID)](#MyTrello+getMember) ⇒ <code>Promise.&lt;(object\|Error)&gt;</code>

<a name="new_MyTrello_new"></a>

 new MyTrello(yamlFile, board)
Create a MyTrello instance.


| Param | Type | Description |
| --- | --- | --- |
| yamlFile | <code>string</code> | The path to the YAML config file. |
| board | <code>string</code> | Trello board ID of the board to use. |

<a name="MyTrello+readYaml"></a>

 myTrello.readYaml() ⇒ <code>object</code>
Attempt to read the YAML file at the path passed into the
    constructor.

**Kind**: instance method of <code>[MyTrello](#MyTrello)</code>  
**Returns**: <code>object</code> - An object of the YAML or null if there is
      any error.  
<a name="MyTrello+getPreAward"></a>

 myTrello.getPreAward() ⇒ <code>Array</code>
Get the pre-award stages from the YAML file.

**Kind**: instance method of <code>[MyTrello](#MyTrello)</code>  
**Returns**: <code>Array</code> - An array of the pre-award stages defined
      in the YAML config file, or an empty array if anything
      goes wrong.  
<a name="MyTrello+getListIDbyName"></a>

 myTrello.getListIDbyName(name) ⇒ <code>Promise.&lt;(string\|Error)&gt;</code>
Get a list ID from its name.

**Kind**: instance method of <code>[MyTrello](#MyTrello)</code>  
**Returns**: <code>Promise.&lt;(string\|Error)&gt;</code> - A promise that resolves with
      the list ID or rejects with an error.  

| Param | Type | Description |
| --- | --- | --- |
| name | <code>string</code> | The list name. |

<a name="MyTrello+getListNameByID"></a>

 myTrello.getListNameByID(id) ⇒ <code>Promise.&lt;(string\|Error)&gt;</code>
Get a list name from its ID.

**Kind**: instance method of <code>[MyTrello](#MyTrello)</code>  
**Returns**: <code>Promise.&lt;(string\|Error)&gt;</code> - A promise that resolves with
      the list name or rejects with an error.  

| Param | Type | Description |
| --- | --- | --- |
| id | <code>string</code> | The list ID. |

<a name="MyTrello+getMember"></a>

 myTrello.getMember(usernameOrID) ⇒ <code>Promise.&lt;(object\|Error)&gt;</code>
Get a member object from either their ID or username.

**Kind**: instance method of <code>[MyTrello](#MyTrello)</code>  
**Returns**: <code>Promise.&lt;(object\|Error)&gt;</code> - A promise that resolves with
      the member object or rejects with an error.  

| Param | Type | Description |
| --- | --- | --- |
| usernameOrID | <code>string</code> | The username or ID of the member       to get. |

<a name="StageManager"></a>

 StageManager
The StageManager class handles the initial setup
  of a board for use as an ADS BPA tracker, based
  on the configuration YAML file.

**Kind**: global class  

* [StageManager](#StageManager)
    * [new StageManager(yamlFile, board)](#new_StageManager_new)
    * [.run()](#StageManager+run) ⇒ <code>Promise.&lt;(string\|Error)&gt;</code>
    * [.getStageandBoard()](#StageManager+getStageandBoard) ⇒ <code>Promise.&lt;(Array\|Error)&gt;</code>
    * [.checkLists(data)](#StageManager+checkLists) ⇒ <code>Array</code>
    * [.makeAdditionalLists(checkedList)](#StageManager+makeAdditionalLists) ⇒ <code>Promise.&lt;undefined, Error&gt;</code>
    * [.closeUnusedStages(data)](#StageManager+closeUnusedStages) ⇒ <code>Promise.&lt;(undefined\|Error)&gt;</code>
    * [.getListCards(trelloID)](#StageManager+getListCards) ⇒ <code>Promise.&lt;(Array\|Error)&gt;</code>
    * [.closeList(listData, trelloListID)](#StageManager+closeList) ⇒ <code>Promise.&lt;(Object\|string\|Error)&gt;</code>
    * [.orderLists(data)](#StageManager+orderLists) ⇒ <code>Promise.&lt;(undefined\|Error)&gt;</code>

<a name="new_StageManager_new"></a>

 new StageManager(yamlFile, board)
Create a StageManager instance.


| Param | Type | Description |
| --- | --- | --- |
| yamlFile | <code>string</code> | The path to the YAML config file. |
| board | <code>string</code> | Trello board ID of the board to use. |

<a name="StageManager+run"></a>

 stageManager.run() ⇒ <code>Promise.&lt;(string\|Error)&gt;</code>
Run the stage manager

**Kind**: instance method of <code>[StageManager](#StageManager)</code>  
**Returns**: <code>Promise.&lt;(string\|Error)&gt;</code> - A promise that resolves with
      the string "complete" or rejects with an error.  
<a name="StageManager+getStageandBoard"></a>

 stageManager.getStageandBoard() ⇒ <code>Promise.&lt;(Array\|Error)&gt;</code>
Get the pre-award stages from configuration and the associated
    lists from Trello.

**Kind**: instance method of <code>[StageManager](#StageManager)</code>  
**Returns**: <code>Promise.&lt;(Array\|Error)&gt;</code> - A promise that resolves with an
      array containing the configured stages as its first element
      and the Trello lists as its second element, or rejects with
      an error.  
<a name="StageManager+checkLists"></a>

 stageManager.checkLists(data) ⇒ <code>Array</code>
Gets an array of list objects based on the configuration,
    indicating whether the config list is present in Trello.

**Kind**: instance method of <code>[StageManager](#StageManager)</code>  
**Returns**: <code>Array</code> - An array of list objects, each with two
      properties: stage (the pre-award stage name) and build
      (a boolean indicating whether a list by the same name
      exists in Trello).  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array</code> | The resolved value from       [getStageandBoard](#StageManager+getStageandBoard). |

<a name="StageManager+makeAdditionalLists"></a>

 stageManager.makeAdditionalLists(checkedList) ⇒ <code>Promise.&lt;undefined, Error&gt;</code>
Create any missing Trello lists, based on the results
    of [checkLists](#StageManager+checkLists).

**Kind**: instance method of <code>[StageManager](#StageManager)</code>  
**Returns**: <code>Promise.&lt;undefined, Error&gt;</code> - A promise that resolves
      with no value if all of the missing lists were created,
      or rejects with an error.  

| Param | Type | Description |
| --- | --- | --- |
| checkedList | <code>Array</code> | The array of list objects       return by [checkLists](#StageManager+checkLists). |

<a name="StageManager+closeUnusedStages"></a>

 stageManager.closeUnusedStages(data) ⇒ <code>Promise.&lt;(undefined\|Error)&gt;</code>
Close Trello lists that do not correspond to a configured
    pre-award stage.

**Kind**: instance method of <code>[StageManager](#StageManager)</code>  
**Returns**: <code>Promise.&lt;(undefined\|Error)&gt;</code> - A promise that resolves
      with no value if all of the extraneous lists are closed,
      or rejects with an error.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array</code> | The resolved value from       [getStageandBoard](#StageManager+getStageandBoard). |

<a name="StageManager+getListCards"></a>

 stageManager.getListCards(trelloID) ⇒ <code>Promise.&lt;(Array\|Error)&gt;</code>
Get the cards from a Trello list by the list ID.

**Kind**: instance method of <code>[StageManager](#StageManager)</code>  
**Returns**: <code>Promise.&lt;(Array\|Error)&gt;</code> - A promise that resolves with
      an array of Trello card objects or rejects with an error.  

| Param | Type | Description |
| --- | --- | --- |
| trelloID | <code>string</code> | The ID of the Trello list       to get cards from. |

<a name="StageManager+closeList"></a>

 stageManager.closeList(listData, trelloListID) ⇒ <code>Promise.&lt;(Object\|string\|Error)&gt;</code>
Close a Trello list by list ID, if it has no cards.

**Kind**: instance method of <code>[StageManager](#StageManager)</code>  
**Returns**: <code>Promise.&lt;(Object\|string\|Error)&gt;</code> - A promise that resolves
      with the object resulting from closing the list or a string
      message indicating that the list did not need to be closed
      (e.g., the list has cards); or rejects with an error.  

| Param | Type | Description |
| --- | --- | --- |
| listData | <code>Array</code> | The list of cards contained       in the list, from [getListCards](#StageManager+getListCards). |
| trelloListID | <code>string</code> | The ID of the list to close. |

<a name="StageManager+orderLists"></a>

 stageManager.orderLists(data) ⇒ <code>Promise.&lt;(undefined\|Error)&gt;</code>
Put Trello lists in order according to their order in
    the configuration file.

**Kind**: instance method of <code>[StageManager](#StageManager)</code>  
**Returns**: <code>Promise.&lt;(undefined\|Error)&gt;</code> - A promise that resolves
      with no value if everything goes okay, or rejects with
      an error.  

| Param | Type | Description |
| --- | --- | --- |
| data | <code>Array</code> | The resolved value from       [getStageandBoard](#StageManager+getStageandBoard). |

