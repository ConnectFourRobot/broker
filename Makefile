SRC := src/vgr-broker.py

init:
	npm install

run:
	npm start

clean:
	rm -rf node_modules

.PHONY: init run clean