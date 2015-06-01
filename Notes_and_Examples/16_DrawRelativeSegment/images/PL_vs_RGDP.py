
# coding: utf-8

# ###Generic Plotting

# In[2]:

import sys
import re
sys.path.append('../Python')

import templateGenerator
reload(templateGenerator)
tGen = templateGenerator.templateGenerator(course_id='DavidsonCollege/DAP002/3T2014',
                                           Title='Generic Plotting',
                                           MacroJS='../JS/MacroAllBoards.js',
                                           JS='PL_vs_RGDP.js',
                                           OutputFile='PL_vs_RGDP.html',
                                           studioPaths=False 
                                          )


# ### HTML Interactive Cell

# In[24]:

get_ipython().run_cell_magic(u'HTML', u'', u'<!DOCTYPE html>\n<html>\n    <head>\n        <meta charset="UTF-8">\n        <title></title>\n        <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/jsxgraph/0.98/jsxgraphcore.js"></script>\n    </head>\n\n    <body>\n        <div style="width: 100%; overflow: hidden;">\n            <div id=\'jxgbox1\' class=\'jxgbox\' style=\'width:500px; height:450px; float:left;\'></div>        \n        </div>\n        \n        <!--START-BUTTON FOR PASS STATE-->\n        <div id=\'StateGrab\' style=\'width:350px; float:left;\'>        \n            <input class="btn" type="button" value="Get State" onClick="getNotebookState()">\n            <div id="spaceBelow">State:</div>\n        </div>\n        <script type="text/javascript">\n            getNotebookState = function(){\n                state = getGrade();\n                statestr = JSON.stringify(state);\n\n                document.getElementById(\'spaceBelow\').innerHTML += \'<br>\'+statestr;\n                var command = "state = " + statestr;\n                console.log(command);\n\n                //Kernel\n                var kernel = IPython.notebook.kernel;\n                kernel.execute(command);\n\n                return statestr;\n            }\n        </script>\n        <!--END-BUTTON FOR PASS STATE-->\n        \n        <script type="text/javascript" src="../JS/jschannel.js"></script>\n        <script type="text/javascript" src="../JS/edxintegration.js"></script>\n        <script type="text/javascript" src="../JS/params1Board.js"></script>\n        <script type="text/javascript" src="../JS/MacroAllBoards.js"></script>\n        <script type="text/javascript" src="PL_vs_RGDP.js"></script>\n    </body>\n</html>')


# ### Generate HTML File

# In[25]:

# reload(templateGenerator)
inputCell = eval('_i%d' % tGen.findIPythonHTMLCell(_ih))
htmlFile = tGen.scrapeHTMLfromIPython(inputCell)
tGen.writeOutputFile(htmlFile)


# In[26]:

def find_midpoint(segment):
    return {'x':(segment.x1 + segment.x2)/2, 'y':(segment.y1 + segment.y2)/2}

def check_relative_position(check, vectors):
    
    if 'SRAS2' not in vectors:
        return 'You have not plotted all vectors.'

    SRAS1 = vectors['SRAS1']
    SRAS2 = vectors['SRAS2']
    
    m1 = find_midpoint(SRAS1)
    m2 = find_midpoint(SRAS2)

    if m1.x < m2.x or m1.y < m2.y:
        return 'Please rethink your solution.'


# In[ ]:

find_midpoint()

