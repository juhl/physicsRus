#!/usr/bin/ruby
# -*- coding: utf-8 -*-
require 'ostruct'
require 'cgi'
require 'open-uri'
require 'iconv'

cgi = CGI.new()
#print "Content-type: text/plain, encoding=UTF-8\r\n\r\n"

action = cgi['action']

conv = Iconv.new('UTF-8', 'euc-kr')

100.times do |idx|
  begin
    open("http://www.ruliweb.com/#{selected_category}/index#{idx > 0 ? idx + 1 : ""}.htm") do |f|
      conv.iconv(f.read) =~ /"conquest_top((.|\n)+?)"conquest_bottom"/
      $1.scan(/a href="(.+?)"><img src="(.+?)".+?alt="(.+?)"/).each do |entry|
        game_title = OpenStruct.new
        game_title.name = entry[2]
        game_title.category = selected_category
        game_title.link = entry[0]
        game_title.imgsrc = entry[1]
        $game_titles << game_title
      end
    end
  rescue
    #print Array($!).concat($@).join("<br>")
    break
  end
end

begin
  f = File.open("gameruli.html.erb", "r:UTF-8")
  data = f.read
  f.close
  tmpl = ERB.new(data)
  print tmpl.result(binding())
rescue
  print $!
end
