var server = "http://imaginerio.axismaps.io:3000",
	  tileserver = "http://imaginerio.axismaps.io:3001/tiles/",
    rasterserver = "http://imaginerio.axismaps.io:3001/raster/";

var mobileSize = 800;
var mobile = $( window ).width() <= mobileSize || window.matchMedia('(max-device-width: 800px)').matches;
var showIntro = gup( 'intro' ) ? gup( 'intro' ) == 'true' : true;
var params = {};

var lang,
	pr = {
		"h1" : "imagináRio",
		"#enter" : 'Ver o mapa &nbsp;&nbsp;&nbsp; <span class="icon-right-bold"></span>',
		"#plans" : "Projetos Urbanos  &nbsp;&#9662;",
		"#switch" : "Legenda do Mapa",
		"#instruction" : "Clique no mapa para explorar...",
		"#export" : "Exportar imagem do mapa",
		"#moreInformation" : "Mais informações",
		"#imageGallery" : "Galeria de imagens",
		"#twitter" : "Postar no Twitter",
		"#facebook" : "Compartilhar no Facebook",
		"#tagline" : "Um Atlas ilustrado e diacronico da evolução social e urbana do Rio de Janeiro",
		"locationOutsideBounds" : "A sua localização não está no mapa",
		"locationError" : "A sua localização não está disponível",
		"#disclaimer" : "Este produto tem fins informativos e não foi preparado nem é adequado para fins legais, de engenharia ou de levantamento topográfico. Não representa um estudo in sitiu e apenas representa localizações relativas aproximadas. Não há qualquer garantia referente à precisão específica ou ao caráter integral deste produto e a Rice University assim como a equipe de pesquisa de imagineRio não assumem qualquer responsabilidade nem respondem por danos decorrentes de erros e omissões."
	},

	en = {
		"locationOutsideBounds" : "Your location is not within the bounds of the map.",
		"locationError" : "Sorry, we were not able to find your location."
	},

	planCredits = [
		["Beaurepaire-Rohan 1840-1843", "Interpreted by Verena Andreatta", "Interpretado por Verena Andreatta"],
		["Comissão de Melhoramentos 1875-1876", "Interpreted by Verena Andreatta", "Interpretado por Verena Andreatta"],
		["Pereira Passos 1903-1906", "Interpreted by Verena Andreatta", "Interpretado por Verena Andreatta"],
		["Le Corbusier", "Interpreted by Farès el-Dahdah", "Interpretado por Farès el-Dahdah"]
	];

function init()
{
	L_PREFER_CANVAS = true;
	L.Icon.Default.imagePath = 'img';

	lang = gup( 'lang' ) == "pr" ? "pr" : "en";
	if( gup( 'dev' ) == 'true' ){
    server = "http://imaginerio-dev.axismaps.io:3000";
	  tileserver = "http://imaginerio-dev.axismaps.io:3001/tiles/";
    rasterserver = "http://imaginerio-dev.axismaps.io:3001/raster/";
	}

	set_language();
	resize();
	check_hash();
	init_map();
	init_layers();
	init_plans();
	init_timeline();
	init_search();

	// Mobile start
	if( mobile ) $('.open').removeClass('open');

	$( window ).resize( resize );

	$( "#enter" ).click( function()
	{
		if( mobile ) {
			if( window.location.search ) window.open( window.location.href + window.location.search + '&intro=false', '_blank' + window.location.hash )
			else window.open( window.location.href + '?intro=false', '_blank' + window.location.hash );
		}
		else $( "#intro" ).fadeOut( "slow" );
	});

	resize();
	map.invalidateSize();

	if( !showIntro )
	{
		$( "#intro" ).hide();
	}
}

function resize()
{
	var h = $( window ).height();

	//mobile
	if( mobile )
	{
		if( $( "#results" ).hasClass( "open-probe" ) )
		{
			var probeh = $( ".open-probe" ).height();
			$( "#wrapper" ).height( h - 70 - probeh );
			$( "#map" ).height( h - 41 - probeh );
		}
		else
		{
			$( "#wrapper" ).height( h - 70 );
			$( "#map" ).height( h - 41 );
		}
	}
	else
	{
		$( "#map" ).height( h - 100 );
		$( "#layers" ).height( h - 210 );
	}

	build_timeline();
	snap_timeline( year, 0 );
}

function cursor_loading( show, p )
{
	if( show )
	{
		$( "#map" ).append(
			$( document.createElement( 'div' ) )
				.attr( "class", "animated zoomIn" )
				.css({
					"top" : p.y + 100,
					"left" : p.x
				})
		);
	}
	else
	{
		$( ".zoomIn" ).remove();
	}
}

function map_loading( show )
{
	if( show && $( "#loading" ).length == 0 )
	{
		$( "#map" ).append(
			$( document.createElement( 'div' ) ).attr( "id", "loading" )
		);

    $( "#loading" ).mouseover( function( e ){
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
    });
	}
	else if( show === false )
	{
		$( "#loading" ).remove();
    map.dragging.enable();
    map.touchZoom.enable();
    map.doubleClickZoom.enable();
    map.scrollWheelZoom.enable();
	}
}

function set_language()
{
	if( lang == "pr" )
	{
		$( "#language span" ).html( "Versão em Português ▼" );
		$( "#language a" )
			.html( "English Version" )
			.attr( "href", "index.html?lang=en" );
		_.each( pr, function( text, sel )
		{
			if ( $( sel ).find( 'label' ).length > 0 ) $( sel ).find( 'label' ).html( text );
			else $( sel ).html( text );
		});

		$( "#search input" ).attr( "placeholder", "Pesquisa..." );
	}
}

function gup( name )
{
	name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regexS = "[\\?&]"+name+"=([^&#]*)";
	var regex = new RegExp( regexS );
	var results = regex.exec( window.location.href );
	if( results == null )
		return "";
	else
		return results[1];
}

function check_hash(){
	var hash = window.location.hash.replace( '#', '' ).split( '/' );
	params.year = hash[ 0 ] ? parseInt( hash[ 0 ], 10 ) : '';
	params.zoom = hash[ 1 ] ? parseInt( hash[ 1 ] ) : '';
	params.center = hash[ 2 ] && hash[ 3 ] ? [ parseFloat( hash[ 2 ] ), parseFloat( hash[ 3 ] ) ] : '';
	params.layers = hash[ 4 ] ? hash[ 4 ].split( '&' ) : [];
	params.raster = hash[ 5 ] ? hash[ 5 ] : '';
	params.plan = hash[ 6 ] ? hash[ 6 ] : '';
}

function update_hash(){
	var layers = '';
	if( off.length !== 0 )
	{
		$( '.layer input:checked').each(function (){
			layers += $( this ).attr( 'value' ) + '&';
		});
		layers = layers.slice( 0, layers.length - 1 );
	}

	var rasters = $( '.visual:not(.layer) input:checked' ).attr( 'value' ) || '';

  window.location.hash = year + "/" + map.getZoom() + "/" + map.getCenter().lat + "/" + map.getCenter().lng + "/" + layers + "/" + rasters + "/" + currentPlan + "/";

	// Update Social Media links
	$( '.twitter-button a' ).attr( 'href', 'https://twitter.com/intent/tweet?url=' + encodeURIComponent( window.location.href ) );

	$( '.facebook-button a' ).attr('href', 'http://www.facebook.com/sharer/sharer.php?u=imaginerio.org/' + encodeURIComponent( window.location.hash ) + '&title=Imagine Rio');
}

function serverError(){
	$( '#enter' ).before(
		$( '<h4>The server has encountered an error.<br>Please try again later</h4>' )
	).remove();
}

/* Social Media loaders */

/* Initialize */
init();
