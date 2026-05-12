<?php
echo "<h1>☕ Lab 9 - PHP Arrays & Regex</h1><hr>";
$m=[['name'=>'Espresso','p'=>3.5,'c'=>'Coffee'],['name'=>'Cappuccino','p'=>4.5,'c'=>'Coffee'],['name'=>'Croissant','p'=>3.25,'c'=>'Pastry']];

echo "<h2>1. Sort by Price</h2>";
$p=$m;usort($p,fn($a,$b)=>$a['p']-$b['p']);
foreach($p as $i)echo $i['name']." - \$".$i['p']."<br>";

echo "<h2>2. Filter by Category</h2>";
$c=array_filter($m,fn($i)=>$i['c']==='Coffee');
foreach($c as $i)echo $i['name']."<br>";

echo "<h2>3. Search Array</h2>";
$f=array_filter($m,fn($i)=>stripos($i['name'],'Cappuccino')!==false);
echo !empty($f)?current($f)['name'].' Found':'Not Found'."<br>";

echo "<h2>4. Email Validation</h2>";
$e=['john@cafe.com','invalid.email','jane@popndine.co.uk'];
$pat='/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/';
foreach($e as $a)echo $a." → ".(preg_match($pat,$a)?'✓':'✗')."<br>";

echo "<h2>5. Extract Domain</h2>";
foreach($e as $a)echo $a." → ".substr($a,strpos($a,'@')+1)."<br>";

echo "<h2>6. Phone Validation</h2>";
$ph=['5551234567','555-123-4567','12345'];
foreach($ph as $x){
$d=preg_replace('/\D/','',$x);
echo $x." → ".(strlen($d)==10?'✓':'✗')."<br>";
}

echo "<h2>7. Extract Numbers</h2>";
$t="Order: 3 Espresso, 2 Cappuccino, 5 Muffins";
preg_match_all('/\d+/',$t,$m);
echo $t."<br>Numbers: ".implode(", ",$m[0])."<br>";

echo "<h2>8. Format Names</h2>";
$n=['john doe','JANE SMITH','robert johnson'];
foreach($n as $x)echo ucwords(strtolower($x))."<br>";

echo "<h2>9. Array Merge</h2>";
$m2=array_merge($m,[['name'=>'Cookie','p'=>2.00]]);
echo "Total: ".count($m2)." items<br>";

echo "<hr><p><strong>Lab 9 Complete!</strong></p>";
?>
