import urllib.request
try:
    with urllib.request.urlopen("http://localhost:8000/docs") as response:
        print(response.status)
except Exception as e:
    print(e)
