electron based app
apis used.. open ai eleven labs and nano bana pro as well as pexels

user inputs - 
slide number or flexible
voice type depending on api
Video duration
Video description
Web search yes or no
Grounded material

Ok so phase 1 - AI generates plan 
So after the inputs the ai eithrt searches the web or takes your grounded material and returns json which has infomation on slide content, type of slide image, diagram, infographic, stock image, script on each slide. In the ai call there is a secription of options for how the slide is displayed - like title, left center, right.. Bullet points left/ right Image left / right that kind of thing returned in structured format

Phase 2 
User builds each slide upon what the AI suggested
So goes to intro slide

Do they agree with the suggested text / if not they can modify. Do they agree with the layout.. The app needs to take the llms suggestion for the layout and put it on a canvas.. Allow the user some functioanlity to edit and move the text at this point. Also i want all those reference images available here to use as backgroudns for the slide the user selects what they want

they then go onto create the diagram - 
They could use an api call to the latest gpt 5.2 to create an html diagram in the colour scheme appropriate to the slide desing you have piocked... the process here would generate the html render it create a png and insert it where the previosu step said an image should be

Alternatively you can click select pexels image -- this would allow you to type a pharase and the app displays the top 10 pexels images.. Again you can pick and inset 1

or the app has use nano banana to generate the image 

Once that is dont you should be able to see the narative at the bottom. You can edit that..

You then click save and move to the next slide and the next slide

When all slides are done you click generate transcript where you can select the voice api for that.. I actually suggest at this point each slide has an individual mp3 file.. There fore we can ensure that when a that mp3 is over we move to the next slide and move to the next mp3.. We then build the entire video

All of the individual components you should be able to look up from the other repos as well as this document 

/home/pete/projects/corndel-explainer-videos/start-up-docs/AI_API_DEEP_DIVE.md
