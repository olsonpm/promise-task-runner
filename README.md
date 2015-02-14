# promise-task-runner

 - This readme covers a few basics.  For anything more, please see [the wiki](https://github.com/olsonpm/promise-task-runner/wiki).  I have spent a lot of effort into making the wiki useful, so give it a shot.
 - To avoid confusion, the abbreviation 'ptr' is for promise-task-runner.

## First of all, why does promise-task-runner exist?
Because I liked the concept of a streaming build-system as made popular by Gulp, but I didn't like its task management library.  I thought dependencies would be best handled using promises, I thought passing in arguments via command-line should be built-in, and I thought tasks should be able to pass results down to other dependent tasks.

## Why would I want to use this tool?
You'll find this tool useful if you're more comfortable managing task dependencies via promises, or want tasks to pass results down to dependent tasks.  I also hope you find ptr easy to pick up, as I've spent a lot of effort organizing the documentation for ease of use.  There are plenty of examples and an explicit API.

## What does a task look like?
You declare a task using the PromiseTask object
```
// tasks/scripts.js
var ptr = require('promise-task-runner');
var PromiseTask = ptr.PromiseTask
var build = new PromiseTask()
  .id('build')
  .task(function() {
    // task logic
  });
```
Then add it to a PromiseTaskContainer and export the container
```
// tasks/build.js
...
var PromiseTaskContainer = ptr.PromiseTaskContainer;
var ptc = new PromiseTaskContainer();
ptc.addTask(build);
module.exports = ptc;
```
Now in your root project folder, you can call:
```
$ ptr run-task build
Finished running task 'build' in 0.2 seconds
```

## Great, how do I get started?
[The wiki should get you on your way](https://github.com/olsonpm/promise-task-runner/wiki/Getting-Started)

## What's with the weird (fluent) api?
You'll notice that instead of passing in constructor function parameters, you pass them in via property functions that act both as getters and setters.  You set the property by passing a parameter, and you get the property by calling it with no parameters.  Thus, using the task 'scripts' from above:
```
scripts.id(); // returns 'scripts'
scripts.id('scripts2'); // sets id to 'scripts2' and returns itself, creating a fluent api

scripts
  .id('scripts')
  .task(function() { ... });
```
It's intuitive and removes ambiguity between what function parameters are, what order they need to be passed, and how optional parameter logic is handled.  [The API preface](https://github.com/olsonpm/promise-task-runner/wiki/API#preface) gives a little more detail.
