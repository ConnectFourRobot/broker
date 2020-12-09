SRC := src/vgr-broker.py

init:
	npm install

run:
	npm run

clean:
	rm -rf node_modules

.PHONY: init run clean