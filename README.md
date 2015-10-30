# CWINE v0.01

## A tool for creating and running Twine-like branching comics

**STILL MASSIVELY UNFINISHED!** Ok, thanks!

## WORKING FEATURES

#### Runtime

- Loads .json game file
- Displays panels and interactive speech bubbles

#### Editor

- Edit panel and panel element properties
- Make panel connections and speech bubble branching connections
- Basic editor features: zoom, drag view, position speech bubbles

## TO-DO

- Hook up rest of Panel and Panel Element properties
- Functionality to "Add New Panel/Panel Element" in editor
- Some extra editor functionality: Multiple selections, some shortcuts

## IN THE FUTURE

#### MORE NODES!

- Random node (goto a random panel), Condition node (goto a panel based on if statement), Set Global Variable node, etc.
- Some sort of string input, random input nodes, so you can plug random thing into a speech bubble.

## How To Install

- Prerequisites: Make sure you have node installed.
- run ```npm install``` in the cwine directory
- run node server.js to run the server.
- go to localhost:8080 for the comic, localhost:8080/edit.html for editting.