# Trello Card Tracker

[![Build Status](https://travis-ci.org/18F/trello-card-tracker.svg?branch=master)](https://travis-ci.org/18F/trello-card-tracker)

[![Code Climate](https://codeclimate.com/github/18F/trello-card-tracker/badges/gpa.svg)](https://codeclimate.com/github/18F/trello-card-tracker)

[![codecov.io](https://codecov.io/github/18F/trello-card-tracker/coverage.svg?branch=master)](https://codecov.io/github/18F/trello-card-tracker?branch=master)

Content of a Trello board for the agile BPA.

### Features

[Full Documentation](documentation.md)

#### Stage Manager
Takes a yaml file of a list of stages and expected times of completion and builds Trello lists in the order of the file.
The stage manager will also close all lists that are not in the stages file.

#### Card Recorder
Will add comments to cards to see how long a card has taken to update.

#### Card Creator
Will create cards that correspond to a particular order listed in an order file.

### Installation

```
git clone https://github.com/18F/trello-card-tracker
cd trello-card-tracker
npm install
```

Set the following `ENV` variables. Can be loaded from a `.env` file.
```
TRELLO_API_KEY
TRELLO_API_TOK
TRELLO_BOARD_ID
TRELLO_BPA_TEST_BOARD
TRELLO_TEST_CARD
```

### Running

Either `npm start` to run the server that will run a daily call to the card-recorder with the default file stages.yaml.

Or run the cli.

`node  cli.js [options]`

- -s   Run the stage manager class with an optional stages file parameter. Without the file it will default to `data/stages.yaml`.
- -r   Run the card recorder with an optional stages file parameter. Without the file it will default to `data/stages.yaml`.   
- -c   Run the card creator with an optional stages file parameter. Without the file it will default to `data/stages.yaml`.

- -i To allow the use of a Trello board ID other than the one included in the .env file.

- -b to run the build comment command line utility. Use the following flags -l "Name of List" -f "MM/DD/YYYY" -t "MM/DD/YYYY" -o totalDays, -d (Optional) Name of list if would like to use another list to calculate the expected time.

### Development
Use the `develop` branch

```
git clone https://github.com/18F/trello-card-tracker.git
git fetch origin develop
npm install --dev
npm start

```

Run the Mocha/Chai tests run via Istanbul.
`npm test`

### Deployment
Note that because the application is a worker [health checks must be disabled](https://docs.cloudfoundry.org/running/apps-enable-diego.html#disable-health-checks).
`cf set-health-check trello-card-tracker none`


### Public domain

This project is in the worldwide [public domain](LICENSE.md). As stated in [CONTRIBUTING](CONTRIBUTING.md):

> This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).
>
> All contributions to this project will be released under the CC0 dedication. By submitting a pull request, you are agreeing to comply with this waiver of copyright interest.
