# promise-task-runner

 - This readme covers a few basics.  For anything more, please see the wiki.
 - To avoid confusion, the abbreviation 'ptr' is for promise-task-runner.

## First of all, why does promise-task-runner exist?
Because I liked the concept of a streaming build-system as made popular by Gulp, but I didn't like its task management library.  Specifically I wanted to pass command line arguments to my tasks as well as pass task results down the dependency chain.  I looked around on npm and there were no existing promise-based task libraries, thus I built my own.

## Why would I want to use this library?
If you're like me and want to pass command line arguments to your tasks, as well as pass down task results down the dependency chain.  You might also like the promise-based interface to running tasks.

## What does a task look like?
You declare a task using the PromiseTask object
```
// tasks/scripts.js
var ptr = require('promise-task-runner');
var PromiseTask = ptr.PromiseTask
var scripts = new PromiseTask()
  .id('scripts')
  .task(function() {
    // task logic
  });
```
Then add it to a PromiseTaskContainer and export the container
```
// tasks/scripts.js
...
var PromiseTaskContainer = ptr.PromiseTaskContainer;
var ptc = new PromiseTaskContainer();
ptc.addTask(scripts);
module.exports = ptc;
```
Now in your root project folder, you can call:
```
$ ptr run-task scripts
Finished running task 'scripts' in 0.2 seconds
```

## What's with the weird (fluent) api?
You'll notice that instead of passing in constructor function parameters, you pass them in via property functions that act both as getters and setters.  You set the property by passing a parameter, and you get the property by calling it with no parameters.  Thus, using the task 'scripts' from above:
```
scripts.id(); // returns 'scripts'
scripts.id('scripts2'); // sets id to 'scripts2' and returns itself, creating a fluent api

scripts
  .id('scripts')
  .task(function() { ... });
```
It's pretty intuitive and removes ambiguity between what function parameters are, what order they need to be passed, and how optional parameter logic is handled.  For more details, please see the API wiki section.
