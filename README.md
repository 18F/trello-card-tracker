# bpa-trello

Content of a Trello board for the agile BPA.

### Features
#### Stage Manager
Takes a yaml file of a list of stages and expected times of completion and builds Trello lists in the order of the file.
The stage manager will also close all lists that are not in the stages file.

#### Card Recorder
Will add comments to cards to see how long a card has taken to update.

#### Card Creator
Will create cards that correspond to a particular order listed in an order file.

### Installation

```
git clone https://github.com/18F/bpa-trello
cd bpa-trello
npm install
```

Set the following `ENV` variables
```
TRELLO_API_KEY
TRELLO_API_TOK
TRELLO_BOARD_ID
TRELLO_BPA_TEST_BOARD
TRELLO_TEST_CARD
```

### Running

Either `npm start` to run the stagemanger with the default file stages.yaml.

Or run the cli.

`node  cli.js [options]`

- -s   Run the stage manager class with an optional stages file parameter. Without the file it will default to `data/stages.yaml`.
- -r   Run the card recorder with an optional stages file parameter. Without the file it will default to `data/stages.yaml`.   
- -c   Run the card creator with an optional stages file parameter. Without the file it will default to `data/stages.yaml`.  

##### Coming Soon

Soon there will be a server to run the cardrecorder.

### Testing

Run the Mocha/Chai tests
`npm test`

### Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
>
> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
