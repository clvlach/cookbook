CREATE SCHEMA `cookbook` DEFAULT CHARACTER SET utf8 ;

CREATE TABLE `cookbook`.`recipes` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `recipe` JSON NOT NULL COMMENT 'An instance of https://schema.org/Recipe.',
  PRIMARY KEY (`id`));

CREATE TABLE `recipe_slugs` (
  `slug` varchar(1000) NOT NULL,
  `recipe_id` int(11) NOT NULL COMMENT 'Refers to recipes.id',
  PRIMARY KEY (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='Maps a recipe title slug used as a URL component, to the recipe itself.';
