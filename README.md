# Vier-Gewinnt-Roboter (Broker)

This service handles a game and manages the communications of the services.

### Prerequisites

Following packages are required before installing the service:

* node (10.x)
* build-essential (just if you want to use the broker as a service)
* mpg123

### Installation

````
git clone git@gitlab.oth-regensburg.de:giv31075/vgr-broker.git
cd vgr-broker
./dev-tools/install.sh
````

### Run application

````
./dev-tools/run.sh
````

### Register application as service

````
./dev-tools/registerService.sh
````
