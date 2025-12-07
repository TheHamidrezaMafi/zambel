# tourbist

Requirements:

- The playwright library is used in the project and also added to the requirements.txt.
For installing this library, use the following commands:
pip install playwright
playwright install
- To compile proto file in python, use the following command in terminal where the proto file exists:
  - python3 -m grpc_tools.protoc -I . --python_out=. --grpc_python_out=.
      scraper.proto


Test guideline:

In order to test the scrapper, run test_cases.py, then copy the output in the console. There is no need to change dates in the test case. Just copy the output and paste it as a json where you need to like postman

If you are running the scrapper on local, use "localhost:50051" for connecting to the scrapper.
