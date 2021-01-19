init:
	npm install

run:
	npm start

clean:
	rm -rf node_modules
	rm -rf dist

.PHONY: init run clean