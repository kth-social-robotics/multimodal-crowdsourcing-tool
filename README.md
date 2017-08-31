# Multimodal Crowdsourcing tool
This tool is meant to be used in order to collect crodwsourced multimodal data from participants using their web browser through their webcam/microphone.
It can be used with the most common crowdsourcing platforms (mturk, crowdflower, prolific acadmic) and probably more.

## Setting up and running the server
In order to build the javascript please go to the folder ```js``` and then

1) ```npm install```
2) ```webpack --w --config webpack.config.js```

Now webpack will be listening for changes in your js folder and update the bundle.js


In order to run the server use the command ```python main.py```

## Modules
The code uses react modules in the ```js/components``` folder and the ```app.jsx``` controls how the user steps trhough these components.


## Citation
If you use any of this work, then please cite the following paper:

Jonell, Patrik, et al. "Crowd-Powered Design of Virtual Attentive Listeners." Intelligent Virtual Agents: 17th International Conference, IVA 2017, Stockholm, Sweden, August 27-30, 2017, Proceedings. Vol. 10498. Springer, 2017.

```
@inproceedings{jonell2017crowd,
  title={Crowd-Powered Design of Virtual Attentive Listeners},
  author={Jonell, Patrik and Oertel, Catharine and Kontogiorgos, Dimosthenis and Beskow, Jonas and Gustafson, Joakim},
  booktitle={Intelligent Virtual Agents: 17th International Conference, IVA 2017, Stockholm, Sweden, August 27-30, 2017, Proceedings},
  volume={10498},
  pages={188},
  year={2017},
  organization={Springer}
}
```
