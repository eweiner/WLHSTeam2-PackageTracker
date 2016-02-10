# Package Tracker

This repository contains the package tracker created by WLHS Team 2 in the IDT programming contest.

## Installation

This project requires Node.js, and this can either be installed using a gui and navigating to:
https://nodejs.org/en/download/
To download Node.js through the command prompt through linux command line:

```
curl -sL https://deb.nodesource.com/setup_5.x | sudo -E bash -
sudo apt-get install -y nodejs
```

After installing Node.js, download this repository and navigate to it in a command line on the machine
that you want to run the server on.
Once you have reached:
```
 */WLHSTeam2-PackageTracker user$ 
```
Use the command:
```
 node webapp.js
```
to start the application and have it listen at port 8080.
Then, simply navigate to your listening machine's ip or url and port on a browser, and the client side
should appear.

## Usage

While this web application was designed to work alone, the fact that it was created using node.js and html/javascript/css means
that it can be easily integrated into a webpage. This allows clients of IDT to navigate to a webpage to track their packages, instead
of having to download a program, an action that may frustrate and deter some clients. 

Node.js was used in order to 'Future proof' this solution. Node.js is a fast growing language that allows for asynchronous actions
that create huge improvements in efficiency. The fact that node can run on almost any platform gives this solution a versatility and scalability that we felt was important in order to replace the groovy RESTFul web service. We decided that the simplicity, 
readability and speed of node were worth the tradeoff versus the given groovy script.

Finally, Javascript/html/css were the best language choices because it allowed for the use of the Google Maps API, an API that became
depricated for Java, python and a few other languages on January 29th. The fantastic framework that Google has built made the use
of Google Maps in the solution seem necessary.
