#!/usr/bin/env python3
import sys
import os
import re

HEADER = """
English Copyright (C) 2017-2019 by Qboxmail Srl

All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any
form or by any means, including photocopying, recording, or other electronic or mechanical
methods, without the prior written permission of the publisher, except in the case of brief quotations
embodied in critical reviews and certain other noncommercial uses permitted by copyright law. For
permission requests, write to the publisher at the address below.

Qboxmail Srl - IT02338120971
https://www.qboxmail.it - info@qboxmail.it

Italiano Copyright (C) 2017-2019 by Qboxmail Srl

Tutti i diritti riservati. Nessuna parte di questa pubblicazione può essere riprodotta, memorizzata in
sistemi di recupero o trasmessa in qualsiasi forma o attraverso qualsiasi mezzo elettronico, meccanico,
mediante fotocopiatura, registrazione o altro, senza l'autorizzazione del possessore del copyright salvo
nel caso di brevi citazioni a scopo critico o altri usi non commerciali consentiti dal copyright. Per le
richieste di autorizzazione, scrivere all'editore al seguente indirizzo.

Qboxmail Srl - IT02338120971
https://www.qboxmail.it - info@qboxmail.it
"""

EXCEPTIONS = ['copyright_header.py','.git','node_modules','sievelib','sievelib_src','fe/build/static/js']

def has_copyright(filename):
    lines = []
    with open(filename,'r') as f:
        lines = f.readlines()
    for l in lines:
        if 'Copyright' in l and 'Qboxmail' in l:
            return True
    return False

def js_copyright_is_different(filename):
    cur_copyright_lines = []
    with open(filename,'r') as f:
        lines = f.readlines()
        for l in lines:
            l = l.strip()
            if l.startswith('* '):
                cur_copyright_lines.append(l.replace('* ',''))
            elif l == '*':
                cur_copyright_lines.append('')
            elif l.endswith('*/'):
                break
    if cur_copyright_lines != [elem.strip() for elem in HEADER.strip().split('\n')]:
        return True
    return False

def css_copyright_is_different(filename):
    cur_copyright_lines = []
    with open(filename,'r') as f:
        lines = f.readlines()
        for l in lines:
            l = l.strip()
            if l.startswith('* '):
                cur_copyright_lines.append(l.replace('* ',''))
            elif l == '*':
                cur_copyright_lines.append('')
            elif l.endswith('*/'):
                break
    if cur_copyright_lines != [elem.strip() for elem in HEADER.strip().split('\n')]:
        return True
    return False

def py_copyright_is_different(filename):
    cur_copyright_lines = []
    with open(filename,'r') as f:
        lines = f.readlines()
        firstFound = False
        for l in lines:
            l = l.strip()
            if l.startswith('# '):
                cur_copyright_lines.append(l.replace('# ',''))
            elif l == '#':
                cur_copyright_lines.append('')
            elif l.startswith('#####'):
                if firstFound == False:
                    firstFound = True
                    continue
                break
    if cur_copyright_lines != [elem.strip() for elem in HEADER.strip().split('\n')]:
        return True
    return False

def sh_copyright_is_different(filename):
    cur_copyright_lines = []
    with open(filename,'r') as f:
        lines = f.readlines()
        firstFound = False
        for l in lines:
            l = l.strip()
            if l.startswith('# '):
                cur_copyright_lines.append(l.replace('# ',''))
            elif l == '#':
                cur_copyright_lines.append('')
            elif l.startswith('#####'):
                if firstFound == False:
                    firstFound = True
                    continue
                break
    if cur_copyright_lines != [elem.strip() for elem in HEADER.strip().split('\n')]:
        return True
    return False

def js_replace_copyright(filename):
    copyright = js_copyright()
    with open(filename,'r+') as f:
        lines = f.readlines()
        chunks = []
        start = False
        for l in lines:
            if start == False:
                if l.strip().endswith('*/'):
                    start = True
                continue
            chunks.append(l.rstrip())
        f.seek(0)
        f.write(copyright)
        f.write('\n'.join(chunks))

def css_replace_copyright(filename):
    copyright = css_copyright()
    with open(filename,'r+') as f:
        lines = f.readlines()
        chunks = []
        start = False
        for l in lines:
            if start == False:
                if l.strip().endswith('*/'):
                    start = True
                continue
            chunks.append(l.rstrip())
        f.seek(0)
        f.write(copyright)
        f.write('\n'.join(chunks))

def py_replace_copyright(filename):
    copyright = py_copyright()
    with open(filename,'r+') as f:
        lines = f.readlines()
        chunks = []
        start = False
        firstFound = False
        header = ''
        for l in lines:
            if l.strip().startswith('#') and 'python' in l:
                header = l.strip()
                continue
            if start == False:
                if l.strip().startswith('#####'):
                    if firstFound == False:
                        firstFound = True
                        continue
                    start = True
                continue
            chunks.append(l.rstrip())
        f.seek(0)
        if header != '':
            f.write(header+'\n')
        f.write(copyright)
        f.write('\n'.join(chunks))

def sh_replace_copyright(filename):
    copyright = sh_copyright()
    with open(filename,'r+') as f:
        lines = f.readlines()
        chunks = []
        start = False
        firstFound = False
        header = ''
        for l in lines:
            if l.strip().startswith('#') and 'bash' in l:
                header = l.strip()
                continue
            if start == False:
                if l.strip().startswith('#####'):
                    if firstFound == False:
                        firstFound = True
                        continue
                    start = True
                continue
            chunks.append(l.rstrip())
        f.seek(0)
        if header != '':
            f.write(header+'\n')
        f.write(copyright)
        f.write('\n'.join(chunks))

def js_copyright():
    copyright  = '/*********************************************************************************************************\n'
    copyright += '\n'.join([' * '+elem.strip() for elem in HEADER.strip().split('\n')]) + '\n'
    copyright += ' *********************************************************************************************************/\n'
    return copyright

def css_copyright():
    copyright  = '/*********************************************************************************************************\n'
    copyright += '\n'.join([' * '+elem.strip() for elem in HEADER.strip().split('\n')]) + '\n'
    copyright += ' *********************************************************************************************************/\n'
    return copyright

def py_copyright():
    copyright  = '###########################################################################################################\n'
    copyright += '\n'.join(['# '+elem.strip() for elem in HEADER.strip().split('\n')]) + '\n'
    copyright += '###########################################################################################################\n'
    return copyright

def sh_copyright():
    copyright  = '###########################################################################################################\n'
    copyright += '\n'.join(['# '+elem.strip() for elem in HEADER.strip().split('\n')]) + '\n'
    copyright += '###########################################################################################################\n'
    return copyright

def js_remove_copyright(filename):
    with open(filename,'r+') as f:
        buf = f.read()
        content = buf[buf.find("*/")+3:]
        if content == buf:
            sys.stdout.write('Error removing copyright from '+filename)
            return
        f.seek(0)
        f.truncate()
        f.write(content)

def js_add_copyright(filename):
    copyright = js_copyright()
    with open(filename,'r+') as f:
        content = f.read()
        f.seek(0)
        f.write(copyright)
        f.write(content)

def css_remove_copyright(filename):
    with open(filename,'r+') as f:
        buf = f.read()
        content = buf[buf.find("*/")+3:]
        if content == buf:
            sys.stdout.write('Error removing copyright from '+filename)
            return
        f.seek(0)
        f.truncate()
        f.write(content)

def css_add_copyright(filename):
    copyright = css_copyright()
    with open(filename,'r+') as f:
        content = f.read()
        f.seek(0)
        f.write(copyright)
        f.write(content)

def py_remove_copyright(filename):
    with open(filename,'r+') as f:
        lines = f.readlines()
        counter = 0
        good_lines = []
        for l in lines:
            if '####' in l and counter < 2:
                counter += 1
                continue
            if counter == 0 or counter >= 2:
                good_lines.append(l)
        content = ''.join(good_lines)
        f.seek(0)
        f.truncate()
        f.write(content)

def py_add_copyright(filename):
    copyright = py_copyright()
    with open(filename,'r+') as f:
        lines = f.readlines()
        f.seek(0)
        content = ''
        if 'python' in lines[0]:
            content = ''.join(lines[1:])
            f.write(lines[0])
            f.write(copyright)
            f.write(content)
        else:
            content = ''.join(lines)
            f.write(copyright)
            f.write(content)

def sh_remove_copyright(filename):
    with open(filename,'r+') as f:
        lines = f.readlines()
        counter = 0
        good_lines = []
        for l in lines:
            if '####' in l and counter < 2:
                counter += 1
                continue
            if counter == 0 or counter >= 2:
                good_lines.append(l)
        content = ''.join(good_lines)
        f.seek(0)
        f.truncate()
        f.write(content)

def sh_add_copyright(filename):
    copyright = sh_copyright()
    with open(filename,'r+') as f:
        lines = f.readlines()
        f.seek(0)
        content = ''
        if 'bash' in lines[0]:
            content = ''.join(lines[1:])
            f.write(lines[0])
            f.write(copyright)
            f.write(content)
        else:
            content = ''.join(lines)
            f.write(copyright)
            f.write(content)

def js_remove_header(filename):
    if has_copyright(filename) == True:
        js_remove_copyright(filename)
        sys.stdout.write('COPYRIGHT REMOVE FROM '+filename+'\n')
    else:
        sys.stdout.write('SKIP '+filename+'\n')

def js_set_header(filename):
    if has_copyright(filename) == False:
        js_add_copyright(filename)
        sys.stdout.write('COPYRIGHT ADDED TO '+filename+'\n')
    elif js_copyright_is_different(filename):
        js_replace_copyright(filename)
        sys.stdout.write('COPYRIGHT REPLACED TO '+filename+'\n')
    else:
        sys.stdout.write('SKIP '+filename+'\n')

def css_set_header(filename):
    if has_copyright(filename) == False:
        css_add_copyright(filename)
        sys.stdout.write('COPYRIGHT ADDED TO '+filename+'\n')
    elif css_copyright_is_different(filename):
        css_replace_copyright(filename)
        sys.stdout.write('COPYRIGHT REPLACED TO '+filename+'\n')
    else:
        sys.stdout.write('SKIP '+filename+'\n')

def css_remove_header(filename):
    if has_copyright(filename) == True:
        css_remove_copyright(filename)
        sys.stdout.write('COPYRIGHT REMOVE FROM '+filename+'\n')
    else:
        sys.stdout.write('SKIP '+filename+'\n')

def py_set_header(filename):
    if has_copyright(filename) == False:
        py_add_copyright(filename)
        sys.stdout.write('COPYRIGHT ADDED TO '+filename+'\n')
    elif py_copyright_is_different(filename):
        py_replace_copyright(filename)
        sys.stdout.write('COPYRIGHT REPLACED TO '+filename+'\n')
    else:
        sys.stdout.write('SKIP '+filename+'\n')

def py_remove_header(filename):
    if has_copyright(filename) == True:
        py_remove_copyright(filename)
        sys.stdout.write('COPYRIGHT REMOVE FROM '+filename+'\n')
    else:
        sys.stdout.write('SKIP '+filename+'\n')

def sh_set_header(filename):
    if has_copyright(filename) == False:
        sh_add_copyright(filename)
        sys.stdout.write('COPYRIGHT ADDED TO '+filename+'\n')
    elif sh_copyright_is_different(filename):
        sh_replace_copyright(filename)
        sys.stdout.write('COPYRIGHT REPLACED TO '+filename+'\n')
    else:
        sys.stdout.write('SKIP '+filename+'\n')

def sh_remove_header(filename):
    if has_copyright(filename) == True:
        sh_remove_copyright(filename)
        sys.stdout.write('COPYRIGHT REMOVE FROM '+filename+'\n')
    else:
        sys.stdout.write('SKIP '+filename+'\n')

remove = False
if len(sys.argv) == 2 and sys.argv[1] == 'remove':
    remove = True

for root, dirs, files in os.walk(".", topdown=False):
   for name in files:
      filepath = os.path.join(root, name)
      to_skip = False
      for e in EXCEPTIONS:
          if '/'+e+'/' in filepath or filepath.endswith(e):
              to_skip = True
              break
      if to_skip: continue

      if filepath.endswith('.js'):
          if remove:
              js_remove_header(filepath)
          else:
              js_set_header(filepath)
      if filepath.endswith('.scss'):
          if remove:
              css_remove_header(filepath)
          else:
              css_set_header(filepath)
      if filepath.endswith('.css'):
          if remove:
              css_remove_header(filepath)
          else:
              css_set_header(filepath)
      elif filepath.endswith('.py'):
          if remove:
              py_remove_header(filepath)
          else:
              py_set_header(filepath)
      elif filepath.endswith('.sh'):
          if remove:
              sh_remove_header(filepath)
          else:
              sh_set_header(filepath)
