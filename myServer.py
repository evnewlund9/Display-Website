
#!/usr/bin/env python3
# See https://docs.python.org/3.2/library/socket.html
# for a decscription of python socket and its parameters

import socket
#add the following modules, so we can refactor EchoServer into HTTP HEAD Server
import os
import stat
import sys
import urllib.parse
import datetime
import errno

from threading import Thread
from argparse import ArgumentParser

BUFSIZE = 4096
#add the following

CRLF = '\r\n'
METHOD_NOT_ALLOWED = 'HTTP/1.1 405  METHOD NOT ALLOWED{}Allow: GET, HEAD, POST {}Connection: close{}{}'.format(CRLF, CRLF, CRLF, CRLF)
OK = 'HTTP/1.1 200 OK{}{}{}'.format(CRLF, CRLF, CRLF) # head request only
NOT_FOUND = 'HTTP/1.1 404 NOT FOUND{}Connection: close{}{}'.format(CRLF, CRLF, CRLF)
FORBIDDEN = 'HTTP/1.1 403 FORBIDDEN{}Connection: close{}{}'.format(CRLF, CRLF, CRLF)

# head requests, get contents of text or html files

def get_contents(fname):
    try:
        with open(fname, 'r') as f:
            return f.read()
    except IOError as e:
        if e.errno == errno.EACCES:
            return FORBIDDEN
        elif e.errno == errno.ENOENT:
            return NOT_FOUND
        else:
            return METHOD_NOT_ALLOWED
    
def get_media_contents(fname):
    try:
        with open(fname, 'rb') as f:
            return f.read()
    except IOError as e:
        if e.errno == errno.EACCES:
            return FORBIDDEN
        elif e.errno == errno.ENOENT:
            return NOT_FOUND
        else:
            return METHOD_NOT_ALLOWED
    
# check file permissions -is file world readable?
def check_perms(resource):
    """Returns True if resource has read permissions set on 'others'"""
    stmode = os.stat(resource).st_mode
    return (getattr(stat, 'S_IROTH') & stmode) > 0

class HTTP_HeadServer:
    def __init__(self, host, port):
        print("Server")
        print('listening on port {}'.format(port))
        self.host = host
        self.port = port
        self.setup_socket()
        self.accept()
        self.sock.shutdown()
        self.sock.close()


    def setup_socket(self):
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.sock.bind((self.host, self.port))
        self.sock.listen(128)
        
    def accept(self):
        while True:
            (client, address) = self.sock.accept()
            # th = Thread(target=client_talk, args=(client, address))
            th = Thread(target=self.accept_request, args=(client, address))
            th.start()

    # here, we add a function belonging to the class HTTP_HeadServer to accept 
    # and process a request

    def accept_request(self, client_sock, client_addr):
        print("accept request")
        data = client_sock.recv(BUFSIZE)
        req = data.decode('utf-8') #returns a string
        response=self.process_request(req) #returns a string
        #once we get a response, we chop it into utf encoded bytes
        #and send it (like EchoClient)
        
        client_sock.send(response)
        #clean up the connection to the client
        #but leave the server socket for recieving requests open
        client_sock.shutdown(1)
        client_sock.close()
        
        #added method to process requests, only head is handled in this code

    def process_request(self, request):
        print('######\nREQUEST:\n{}######'.format(request))
        linelist = request.strip().split(CRLF)
        reqline = linelist[0]
        rlwords = reqline.split()
        headerAndBody = linelist[-1]
        if len(rlwords) == 0:
            return''
        if rlwords[0] == 'HEAD':  
            resource = rlwords[1][1:] # skip beginning /
            return self.head_request(resource)
        elif rlwords[0] == 'GET':
            resource = rlwords[1][1:]
            return self.get_request(resource)
        elif rlwords[0] == 'POST':
            resource = rlwords[1][1:]
            return self.post_request(headerAndBody)
        else: #add ELIF checks for GET and POST before this else..
            return METHOD_NOT_ALLOWED
        
    def head_request(self, resource):
        """Handles HEAD requests."""
        path = os.path.join('.', resource) #look in directory where server is running
        if not os.path.exists(resource):
            ret = NOT_FOUND
        elif not check_perms(resource):
            ret = FORBIDDEN
        else:
            ret = OK
        return ret
    
    #creates responses to get requests 
    def get_request(self, resource):
        
        type = resource.split(".")
        header = 'HTTP/1.1 200 OK\n'
        path = resource
        result = bytes(header, 'utf-8')
            
        if len(type) == 2:
            if type[1] == 'png': 
                header += 'Content-Type: image/png\n\n'
                result = bytes(header, 'utf-8')
                status = get_media_contents(path)
                if status == FORBIDDEN or status == NOT_FOUND or status == METHOD_NOT_ALLOWED:
                  html = ""
                  if status == FORBIDDEN:
                        html = "403.html"
                  elif status == NOT_FOUND:
                        html = "404.html"
                  elif status == METHOD_NOT_ALLOWED:
                        return bytes(status, 'utf-8')
                      
                  header = 'HTTP/1.1 200 OK\n'
                  header += 'Content-Type: text/html\n\n'
                  result = bytes(header, 'utf-8')
                  status = get_contents(html)
                  for l in status.split('\n'):
                      s = ""+l+""
                      result += bytes(s, 'utf-8')
                  return result
                else:
                    result = result + status
                
            elif type[1] == 'jpg': 
                header += 'Content-Type: image/jpg\n\n'
                result = bytes(header, 'utf-8') 
                status = get_media_contents(path)
                if status == FORBIDDEN or status == NOT_FOUND or status == METHOD_NOT_ALLOWED:
                  html = ""
                  if status == FORBIDDEN:
                        html = "403.html"
                  elif status == NOT_FOUND:
                        html = "404.html"
                  elif status == METHOD_NOT_ALLOWED:
                        return bytes(status, 'utf-8')
                      
                  header = 'HTTP/1.1 200 OK\n'
                  header += 'Content-Type: text/html\n\n'
                  result = bytes(header, 'utf-8')
                  status = get_contents(html)
                  for l in status.split('\n'):
                      s = ""+l+""
                      result += bytes(s, 'utf-8')
                  return result
                else:
                    result = result + status
            
            elif type[1] == 'mp3': 
                header += 'Content-Type: audio/mpeg\n\n'
                result = bytes(header, 'utf-8') 
                status = get_media_contents(path)
                if status == FORBIDDEN or status == NOT_FOUND or status == METHOD_NOT_ALLOWED:
                  html = ""
                  if status == FORBIDDEN:
                        html = "403.html"
                  elif status == NOT_FOUND:
                        html = "404.html"
                  elif status == METHOD_NOT_ALLOWED:
                        return bytes(status, 'utf-8')
                      
                  header = 'HTTP/1.1 200 OK\n'
                  header += 'Content-Type: text/html\n\n'
                  result = bytes(header, 'utf-8')
                  status = get_contents(html)
                  for l in status.split('\n'):
                      s = ""+l+""
                      result += bytes(s, 'utf-8')
                  return result
                else:
                    result = result + status
                
            elif type[1] == 'html':
                header += 'Content-Type: text/html\n\n'
                result = bytes(header, 'utf-8')
                status = get_contents(path)
                print(status)
                if status == FORBIDDEN or status == NOT_FOUND or status == METHOD_NOT_ALLOWED:
                  html = ""
                  if status == FORBIDDEN:
                        html = "403.html"
                  elif status == NOT_FOUND:
                        html = "404.html"
                  elif status == METHOD_NOT_ALLOWED:
                        return bytes(status, 'utf-8')
                      
                  header = 'HTTP/1.1 200 OK\n'
                  header += 'Content-Type: text/html\n\n'
                  result = bytes(header, 'utf-8')
                  status = get_contents(html)
                  for l in status.split('\n'):
                      s = ""+l+""
                      result += bytes(s, 'utf-8')
                  return result
                else:
                    for l in status.split('\n'):
                        s = ""+l+""
                        result += bytes(s, 'utf-8')
                    
        elif len(type) == 1:
            header = 'HTTP/1.1 307 TEMPORARY REDIRECT\n'
            header += 'Location: https://www.youtube.com/results?search_query='
            
            query = type[0].split("=")[1]
            header += query + "\n\n"
            result = bytes(header, 'utf-8')
                
        return result
        
    #creates responses to post requests 
    #constructs a simple html table to post form data
    def post_request(self, resource):
        header = 'HTTP/1.1 200 OK\n'
        header += 'Content-Type: text/html\n\n'
        
        html = "" + "<!DOCTYPE html>" + ""
        html += "" + "<html>" + ""
        html = "" + "<head>" + ""
        html += "" + "<meta charset='utf-8'>" + ""
        html = "" + "<style>" + ""
        html = "" + "table {" + ""
        html = "" + "border-collapse: collapse;" + ""
        html = "" + "}" + ""
        html = "" + "table, th, td {" + ""
        html = "" + "border-collapse: collapse;" + ""
        html = "" + "border: 1px solid black;" + ""
        html = "" + "}" + ""
        html = "" + "</style>"
        html += "" + "<title>Form Data</title>" + ""
        html += "" + "</head>" + ""
        html += "" + "<body>" + ""
        html += "" + "<h1>Form Data</h1>" + ""
        html += "" + "<table border='1px solid black'>" + ""
        
        for label in resource.split("&")[0:6]:
            name = label.split("=")[0]
            value = label.split("=")[1]
            print(value)
            multiStr = ""
            for word in value.split("+"):
                multiStr += word
            html += "" + "<tr>" + ""
            html += "" + "<td>" + name + "</td>" + ""
            html += "" + "<td>" + multiStr + "</td>" + ""
            html += "" + "</tr>" + ""
        
        html += "" + "</table>" + ""
        html += "" + "</body>" + ""
        html += "" + "</html>" + ""
        
        result = bytes(header + html, 'utf-8')
        return result
        
        

# use --port [number] or -p [number] to specify a port other than 9001
def parse_args():
    parser = ArgumentParser()
    parser.add_argument('-p','--port', type=int, default=9001,required=False,help='specify a port to operate on (default: 9001)')
    args = parser.parse_args()
    return args.port

if __name__ == '__main__':
    port = parse_args()
    HTTP_HeadServer('localhost', port)
    