import calendar
year=int(input("enter year : "))
print("main menu")
num=int(input("enter u r choice :"))
match num:
    case 1:
        a=year%2
        if a==0:
            print("even",a)
        else:
            print("odd")
    case 2:
        if is leap:
            print("leap year")
        else:
            print("not")
    case 3:
        if year >0:
            print("+ve")
        else:
            print("-ve")
    case _:
        print("exit")

print("HELLO")      
