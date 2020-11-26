SRC := src/vgr-broker.py

init:
	pip install -r requirements.txt

run:
	@python ${SRC}

clean:
	rm -rf .pytest_cache .coverage .pytest_cache coverage.xml

.PHONY: init run clean