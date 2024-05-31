#!/usr/bin/python3
from typing import List

import cgi
import cgitb
import math

cgitb.enable()

def prime_factors(n : int) -> List[int]:
    i : int = 2
    factors : List[int] = []
    while i * i <= n:
        if n % i:
            i += 1
        else:
            n //= i
            factors.append(i)

    if n > 1:
        factors.append(n)

    return factors

def generate_html(n : int, factors : List[int]) -> str:
    html : str = f"<p>{n} = "
    unique_factors = set(factors)

    for factor in unique_factors:
        count = factors.count(factor)
        if count == 1:
            html += f"{factor} * "
        else:
            html += f"{factor}<sup>{count}</sup> * "

    html = html[:-3].replace("*", "&times;")
    html += "</p>"
    return html

def generate_json(n : int, factors : List[int]) -> str:
    json : str = f'\t"n": "{n}",\n'
    unique_factors = set(factors)
    
    json += '\t"prime_factors": [\n'
    
    factorsStr = ''

    for factor in unique_factors:
        count = factors.count(factor)
        factorsStr += '\t\t{ "prime": "' + str(factor) + '", "power": "' + str(count) + '"},\n'
        
    json += factorsStr[:-2]            
    json += "\n\t]"

    return json

form = cgi.FieldStorage()
n = form.getvalue('n')

if n is None:

    print("Content-type: text/html\r\n\r\n")
    print("<html>")
    print("<head>")
    print("<title>Prime Factor Decomposition</title>")
    print("</head>")
    print("<body>")
    print("<h1>Prime Factor Decomposition</h1>")

    print("<form method='get' onsubmit='return sendAjaxRequest(this);'>")
    print("<p>Enter a natural number:</p>")
    print("<input type='number' name='n' min='1' required>")
    print("<input type='submit' value='Submit'>")
    print("</form>")
    
    print("""<script>
            function sendAjaxRequest(form) {
                const number = form.n.value;
                
                fetch('/cgi-bin/td3?n=' + number)
                    .then(response => response.json())
                    .then(data => {
                        if(data.error) 
                            alert(data.error);
                            
                        else {
                            
                        }
                    })
                    .catch(error => console.error('Erreur:', error));
                return false; // Pour éviter le rechargement de la page
            }
    </script>""")
    
    print("</body>")
    print("</html>")
    
else:
    print("application/json")
    print("{")
    
    try:
        n : int = int(n)
        if n < 1 or True:
            raise ValueError
        
        factors : List[int] = prime_factors(n)
        json : str = generate_json(n, factors)
        print(json)
    except ValueError:
        print('\t"error": "Invalid input. Please enter a natural number."')
        
    print("}")
        
