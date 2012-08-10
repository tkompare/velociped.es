<?php
if($_POST || $_GET)
{
	require_once 'dbcon_velocipedes.php';
	$mysqli = new mysqli
	(
		$velocipedes['servername'],
		$velocipedes['username'],
		$velocipedes['password'],
		$velocipedes['dbname'],
		$velocipedes['port']
	);
	if ($mysqli->connect_errno) {
		echo(json_encode(utf8_encode(htmlentities('Error'))));
	}
	if($_POST)
	{
		$latlngs = $mysqli->real_escape_string($_POST['latlngs']);
		$query = "INSERT INTO tRoute (RouteData) VALUES ('$latlngs')";
		$mysqli->query($query);
		$RouteId = $mysqli->insert_id;
		echo(json_encode(utf8_encode(htmlentities($RouteId))));
		exit();
	}
	if($_GET)
	{
		
		echo(json_encode(utf8_encode(htmlentities('GET'))));
		exit();
	}
	$mysqli->close();
}
?>