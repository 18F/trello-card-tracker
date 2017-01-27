set -e

API="https://api.fr.cloud.gov"
ORG="gsa-acq-proto"
SPACE="trello-card-tracker"
MANIFEST="manifest.yml"

cf login -a $API -u $CF_USERNAME -p $CF_PASSWORD -o $ORG -s $SPACE
cf push $NAME -f $MANIFEST
