<?php

$mysqldbconnection = mysqli_connect('127.0.0.1','root','','d002993d') OR die(mysqli_error($mysqldbconnection));
mysqli_query($mysqldbconnection, "set names 'utf8'");

$sql = "SELECT
      *
      FROM
      deck
      ORDER BY
      name ASC;";

$result = mysqli_query($mysqldbconnection, $sql) OR die(mysqli_error($mysqldbconnection));

$decks = [];
$cardNames = [];

while($row = mysqli_fetch_assoc($result))
{
  $deck = [];
  $deck['name'] = $row['name'];
  $cardsInDeck = explode('§', $row['deck']);
  $deck['cards'] = $cardsInDeck;
  $decks[] = $deck;
  $cardNames = array_merge($cardNames, $cardsInDeck);
}

$cardNames = array_unique($cardNames);
$cards = [];
foreach ($cardNames as $value) {
  $escValue = mysqli_real_escape_string($mysqldbconnection, $value);
  $sql = "SELECT * FROM cards WHERE name = '" . $escValue . "';";
  $result = mysqli_query($mysqldbconnection, $sql) OR die(mysqli_error($mysqldbconnection));
  $found = false;
  while($row = mysqli_fetch_assoc($result))
  {
    $card = [];
    $card['name'] = $value;
    $card['img'] = $row['picture'];
    $cards[] = $card;
    $found = true;
    break;
  }
  if (!$found) {
    $card = [];
    $card['name'] = $value;
    $cards[] = $card;
    $found = true;
  }
}

$ret = [];
$ret["cards"] = $cards;
$ret["decks"] = $decks;

$encoded = json_encode($ret);
$err = json_last_error_msg();
if ($err != 'No error') {
  echo $err;
}

header('Content-type: application/json');
echo 'window.mrnData = ' . $encoded;
?>